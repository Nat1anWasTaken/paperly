import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional

from beanie import WriteRules
from pydantic import BaseModel, Field

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.models.block import Block, BlockKind
from src.openai import client, model
from src.utils.blocks import get_blocks_in_order, create_block_from_info, insert_block_after
from src.worker.base import BaseWorker

logger = get_logger(__name__)


@dataclass
class Section:
    """
    Represents a section of a paper with its title, content, and associated blocks.
    """
    title: str
    content: str
    blocks: List[Block]
    header_block: Optional[Block] = None


class QuizQuestion(BaseModel):
    """
    Represents a single quiz question with its options and correct answer.
    """
    question: str = Field(..., description="The question text")
    options: List[str] = Field(..., min_length=4, max_length=4,
                               description="Four answer options in format 'A) Option A', 'B) Option B', etc.")
    correct_answer: int = Field(..., ge=0, le=3, description="The index of the correct answer (0-3)")
    explanation: str = Field(..., description="Explanation of why the correct answer is right")


class QuizResponse(BaseModel):
    """
    Response model for quiz generation containing multiple questions.
    """
    questions: List[QuizQuestion] = Field(..., description="List of generated quiz questions")


class SectionExtractor:
    """
    Handles extraction of sections from paper blocks.
    """

    def extract_sections(self, blocks: List[Block]) -> List[Section]:
        """
        Extract sections from a list of blocks, using Header blocks as section boundaries.
        
        :param blocks: List of blocks to process.
        :return: List of Section objects.
        :rtype: List[Section]
        """
        if not blocks:
            return []

        sections = []
        current_header = None
        current_blocks = []

        for block in blocks:
            if block.kind == BlockKind.HEADER:
                if current_header is not None:
                    section = self._create_section(current_header, current_blocks)
                    if section:
                        sections.append(section)

                current_header = block
                current_blocks = []
            else:
                current_blocks.append(block)

        if current_header is not None:
            section = self._create_section(current_header, current_blocks)
            if section:
                sections.append(section)

        logger.info(f"Extracted {len(sections)} sections from {len(blocks)} blocks")
        return sections

    def _create_section(self, header_block: Block, content_blocks: List[Block]) -> Optional[Section]:
        """
        Create a Section object from header and content blocks.
        
        :param header_block: The header block for this section.
        :param content_blocks: List of blocks that belong to this section.
        :return: Section object or None if no valid content.
        :rtype: Optional[Section]
        """
        title = header_block.text if hasattr(header_block, 'text') else "Untitled Section"
        content = self._extract_text_content(content_blocks)

        if not content.strip():
            logger.debug(f"Skipping empty section: {title}")
            return None

        return Section(
            title=title,
            content=content,
            blocks=content_blocks,
            header_block=header_block
        )

    def _extract_text_content(self, blocks: List[Block]) -> str:
        """
        Extract readable text content from a list of blocks.
        
        :param blocks: List of blocks to extract text from.
        :return: Combined text content.
        :rtype: str
        """
        content_parts = []

        for block in blocks:
            if hasattr(block, 'text') and block.text:
                content_parts.append(block.text)
            elif hasattr(block, 'code') and block.code:
                language = getattr(block, 'language', '')
                content_parts.append(f"```{language}\n{block.code}\n```")
            elif hasattr(block, 'equation') and block.equation:
                content_parts.append(f"Equation: {block.equation}")
            elif hasattr(block, 'caption') and block.caption:
                content_parts.append(f"Figure: {block.caption}")

        return '\n'.join(content_parts)

    def find_insertion_point(self, section: Section) -> Optional[Block]:
        """
        Find the appropriate block to insert quizzes after for a given section.
        
        :param section: The section to find insertion point for.
        :return: Block to insert after, or None if not found.
        :rtype: Optional[Block]
        """
        if not section.blocks:
            return section.header_block
        return section.blocks[-1]


class QuizGenerator:
    """
    Handles quiz generation using Azure OpenAI.
    """

    def __init__(self):
        self.system_prompt = (
            "You are an expert quiz generator for academic papers. "
            "Generate high-quality multiple choice questions that test understanding of key concepts."
        )
        self.prompt_template = self._load_prompt_template()
        self.response_format = self._get_response_format()

    def _load_prompt_template(self) -> str:
        """
        Load the prompt template from file.
        
        :return: Prompt template string.
        :rtype: str
        """
        try:
            prompt_path = Path(__file__).parent.parent.parent / "prompts" / "generate_quizzes.txt"
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            logger.warning(f"Prompt file not found at {prompt_path}, using fallback prompt")
            return self._get_fallback_prompt()
        except Exception as e:
            logger.error(f"Error loading prompt template: {e}")
            return self._get_fallback_prompt()

    def _get_fallback_prompt(self) -> str:
        """
        Fallback prompt if file loading fails.
        
        :return: Fallback prompt string.
        :rtype: str
        """
        return '''Based on the following academic paper section titled "{section_title}", generate {num_questions} multiple choice questions that test understanding of the key concepts.

Section content:
{content}

Focus on testing comprehension of main concepts, methodology, and key findings rather than memorization of details.'''

    def _get_response_format(self) -> type[QuizResponse]:
        """
        Get the Pydantic model for structured output.
        
        :return: QuizResponse Pydantic model.
        :rtype: type[QuizResponse]
        """
        return QuizResponse

    async def generate_quizzes(self, content: str, section_title: str, num_questions: int = 3) -> List[QuizQuestion]:
        """
        Generate quiz questions for a given section content.
        
        :param content: The content to generate quizzes for.
        :param section_title: The title of the section.
        :param num_questions: Number of questions to generate (default: 3).
        :return: List of QuizQuestion objects.
        :rtype: List[QuizQuestion]
        """
        if not content.strip():
            logger.warning(f"Empty content provided for section: {section_title}")
            return []

        try:
            prompt = self._build_prompt(content, section_title, num_questions)
            quiz_response = await self._call_openai(prompt)
            return quiz_response.questions
        except Exception as e:
            logger.error(f"Failed to generate quizzes for section '{section_title}': {str(e)}")
            return []

    def _build_prompt(self, content: str, section_title: str, num_questions: int) -> str:
        """
        Build the prompt for quiz generation.
        
        :param content: The content to generate quizzes for.
        :param section_title: The title of the section.
        :param num_questions: Number of questions to generate.
        :return: Formatted prompt string.
        :rtype: str
        """
        return self.prompt_template.format(
            section_title=section_title,
            content=content,
            num_questions=num_questions
        )

    async def _call_openai(self, prompt: str) -> QuizResponse:
        """
        Call Azure OpenAI API to generate quiz content with structured output.
        
        :param prompt: The prompt to send to OpenAI.
        :return: Parsed QuizResponse from OpenAI.
        :rtype: QuizResponse
        """
        response = await asyncio.to_thread(
            client.beta.chat.completions.parse,
            model=model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format=self.response_format
        )

        logger.info(response)

        return response.choices[0].message.parsed


class QuizBlockInserter:
    """
    Handles insertion of quiz blocks into the paper structure.
    """

    async def insert_quizzes(self, quizzes: List[QuizQuestion], insertion_point: Block, paper,
                             section_title: str) -> int:
        """
        Insert quiz blocks after the specified insertion point.
        
        :param quizzes: List of QuizQuestion objects to insert.
        :param insertion_point: Block to insert after.
        :param paper: Paper reference.
        :param section_title: Section title for logging.
        :return: Number of quizzes successfully inserted.
        :rtype: int
        """
        previous_block = insertion_point
        inserted_count = 0

        for quiz in quizzes:
            try:
                quiz_block_info = self._quiz_to_block_info(quiz)
                quiz_block = await create_block_from_info(quiz_block_info, paper)

                if quiz_block:
                    await insert_block_after(quiz_block, previous_block)
                    previous_block = quiz_block
                    inserted_count += 1
                    logger.debug(f"Created quiz block {quiz_block.id} for section '{section_title}'")

            except Exception as e:
                logger.error(f"Failed to create quiz block for section '{section_title}': {str(e)}")
                continue

        return inserted_count

    def _quiz_to_block_info(self, quiz: QuizQuestion) -> Dict[str, Any]:
        """
        Convert a QuizQuestion to block info format for block creation.
        
        :param quiz: QuizQuestion object to convert.
        :return: Block info dictionary.
        :rtype: Dict[str, Any]
        """
        return {
            'type': 'quiz',
            'question': quiz.question,
            'options': quiz.options,
            'correct_answer': quiz.correct_answer,
            'explanation': quiz.explanation
        }


class GenerateQuizzesWorker(BaseWorker):
    """
    A worker class that generates quizzes for paper sections using Azure OpenAI.
    
    This worker processes analyses in BLOCK_PROCESSED status, breaks down blocks
    into sections by Header blocks, and generates 2-3 quizzes for each section.
    """

    def __init__(self):
        super().__init__()
        self.section_extractor = SectionExtractor()
        self.quiz_generator = QuizGenerator()
        self.quiz_inserter = QuizBlockInserter()

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.
        
        :return: AnalysisStatus.BLOCK_PROCESSED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.BLOCKS_PROCESSED

    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis by generating quizzes for each section.
        
        :param analysis: The analysis to process.
        """
        logger.info(f"Starting quiz generation for analysis {analysis.id}")

        analysis.status = AnalysisStatus.GENERATING_QUIZZES
        await analysis.save(link_rule=WriteRules.WRITE)

        blocks = await get_blocks_in_order(analysis.paper.ref.id)
        logger.info(f"Retrieved {len(blocks)} blocks for paper {analysis.paper.ref.id}")

        if not blocks:
            logger.warning(f"No blocks found for paper {analysis.paper.ref.id}")
            await self._complete_analysis(analysis)
            return

        sections = self.section_extractor.extract_sections(blocks)
        logger.info(f"Found {len(sections)} sections for analysis {analysis.id}")

        total_quizzes_created = 0

        for section in sections:
            logger.info(f"Generating quizzes for section: {section.title}")

            quizzes = await self.quiz_generator.generate_quizzes(section.content, section.title)

            if not quizzes:
                logger.warning(f"No quizzes generated for section: {section.title}")
                continue

            insertion_point = self.section_extractor.find_insertion_point(section)
            if not insertion_point:
                logger.warning(f"Could not find insertion point for section: {section.title}")
                continue

            total_quizzes_created += await self.quiz_inserter.insert_quizzes(
                quizzes, insertion_point, analysis.paper.ref, section.title
            )

        await self._complete_analysis(analysis)
        logger.info(
            f"Quiz generation completed for analysis {analysis.id}. Created {total_quizzes_created} quizzes across {len(sections)} sections")

    async def _complete_analysis(self, analysis: Analysis):
        """
        Mark analysis as completed.
        
        :param analysis: The analysis to complete.
        """
        analysis.status = AnalysisStatus.COMPLETED
        await analysis.save(link_rule=WriteRules.WRITE)
