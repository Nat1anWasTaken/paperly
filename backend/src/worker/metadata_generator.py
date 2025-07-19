import asyncio
import re
from pathlib import Path

from beanie import WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.models.paper import Paper
from src.openai import client, model
from src.worker.base import BaseWorker

logger = get_logger(__name__)


async def extract_title_with_ai(markdown_content: str) -> str:
    """
    Extract paper title using GPT-4o by analyzing the entire markdown content.

    Uses AI to intelligently determine the most appropriate title based on the
    paper's content rather than just taking the first heading.
    
    :param markdown_content: The markdown content to analyze.
    :return: The extracted title from AI analysis.
    :rtype: str
    """
    if not markdown_content or not markdown_content.strip():
        return "Untitled Paper"

    try:
        # Load prompt template
        prompt_path = Path(__file__).parent.parent.parent / "prompts" / "extract_title.txt"
        with open(prompt_path, 'r', encoding='utf-8') as f:
            prompt_template = f.read().strip()
        
        # Format prompt with markdown content
        prompt = prompt_template.format(markdown_content=markdown_content)
        
        # Call OpenAI API
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        title = response.choices[0].message.content
        if title:
            title = title.strip()
        else:
            title = ""
        
        # Fallback to ensure we have a valid title
        if not title or len(title) > 200:
            return extract_first_biggest_heading_fallback(markdown_content)
            
        return title
        
    except Exception as e:
        logger.error(f"Failed to extract title with AI: {str(e)}")
        return extract_first_biggest_heading_fallback(markdown_content)


def extract_first_biggest_heading_fallback(markdown_content: str) -> str:
    """
    Fallback method to extract the first, biggest heading from markdown content.

    Prioritizes headings by size (# > ## > ### etc.) and returns the first one found
    at the highest level.
    
    :param markdown_content: The markdown content to parse.
    :return: The extracted heading text without the # symbols.
    :rtype: str
    """
    if not markdown_content:
        return "Untitled Paper"

    heading_pattern = r'^(#{1,6})\s+(.+)$'
    headings = []

    for line in markdown_content.split('\n'):
        match = re.match(heading_pattern, line.strip())
        if match:
            level = len(match.group(1))  # Number of # symbols
            text = match.group(2).strip()
            headings.append((level, text))

    if not headings:
        return "Untitled Paper"

    min_level = min(heading[0] for heading in headings)

    for level, text in headings:
        if level == min_level:
            return text

    return "Untitled Paper"


class MetadataGeneratorWorker(BaseWorker):
    """
    A worker class that processes markdown texts to generate metadata.
    """

    def __init__(self):
        super().__init__()

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.
        
        :return: AnalysisStatus.MARKDOWN_EXTRACTED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.MARKDOWN_EXTRACTED

    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis by generating metadata from the markdown.
        
        :param analysis: The analysis to process.
        """
        logger.info(f"Starting metadata generation for analysis {analysis.id}")
        logger.debug(f"Processing markdown for analysis {analysis.id}")

        analysis.status = AnalysisStatus.GENERATING_METADATA
        await analysis.save(link_rule=WriteRules.WRITE)

        # Extract title using AI analysis of the markdown content
        markdown_content = analysis.processed_markdown or ""
        title = await extract_title_with_ai(markdown_content)
        logger.info(f"Extracted title using AI: '{title}' for analysis {analysis.id}")

        # Create a Paper object for the uploaded paper
        paper = Paper(
            title=title
        )

        # Save the paper to the database
        await paper.insert()
        logger.info(f"Created paper {paper.id} with title '{title}'")

        # Update the analysis with the paper ID and status
        from beanie import Link
        analysis.paper = Link(paper, Paper)
        analysis.status = AnalysisStatus.METADATA_GENERATED
        await analysis.save(link_rule=WriteRules.WRITE)

        logger.info(
            f"Analysis {analysis.id} updated with paper_id {paper.id} and status changed to METADATA_GENERATED")
