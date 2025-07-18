import asyncio
import re
import base64
import uuid
from asyncio import AbstractEventLoop
from typing import List, Optional, Tuple, Union
from io import BytesIO

from beanie import PydanticObjectId, WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.models.block import (
    Block, BlockKind, Header, Paragraph, Figure, Table, Equation, 
    CodeBlock, Quote, Callout, Reference, Footnote, Quiz, Question
)
from src.storage.s3 import storage_client, bucket_name

logger = get_logger(__name__)


async def pull_existing_analyses() -> List[Analysis]:
    """
    Pull existing tasks from the database that are in the METADATA_GENERATED status.
    
    :return: List of Analysis objects with status METADATA_GENERATED.
    :rtype: List[Analysis]
    """
    logger.debug("Querying for analyses with METADATA_GENERATED status")

    analyses = await Analysis.find({
        "status": AnalysisStatus.METADATA_GENERATED
    }).to_list()

    logger.info(f"Found {len(analyses)} analyses in METADATA_GENERATED status")

    return analyses


async def upload_image_to_bucket(image_data: bytes, paper_id: str, image_name: str) -> str:
    """
    Upload an image to S3 bucket and return the public URL.
    
    :param image_data: The image data as bytes.
    :param paper_id: The ID of the paper this image belongs to.
    :param image_name: The name of the image file.
    :return: The public URL of the uploaded image.
    :rtype: str
    """
    # Generate a unique key for the image
    image_key = f"papers/{paper_id}/images/{uuid.uuid4()}_{image_name}"
    
    try:
        # Upload to S3
        storage_client.put_object(
            Bucket=bucket_name,
            Key=image_key,
            Body=image_data,
            ContentType="image/png"  # Default to PNG, could be enhanced to detect type
        )
        
        # Generate the public URL
        image_url = f"https://{bucket_name}.s3.amazonaws.com/{image_key}"
        logger.info(f"Successfully uploaded image to {image_url}")
        
        return image_url
    except Exception as e:
        logger.error(f"Failed to upload image to S3: {str(e)}")
        raise


def parse_markdown_blocks(markdown_content: str) -> List[dict]:
    """
    Parse markdown content into structured blocks.
    
    :param markdown_content: The markdown content to parse.
    :return: List of block dictionaries with type and content.
    :rtype: List[dict]
    """
    blocks = []
    lines = markdown_content.split('\n')
    current_block = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
            
        # Headers
        if line.startswith('#'):
            if current_block:
                blocks.append(current_block)
            
            level = len(line) - len(line.lstrip('#'))
            text = line[level:].strip()
            current_block = {
                'type': 'header',
                'level': level,
                'text': text
            }
            
        # Code blocks
        elif line.startswith('```'):
            if current_block:
                blocks.append(current_block)
            
            language = line[3:].strip() if len(line) > 3 else None
            code_lines = []
            i += 1
            
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
                
            current_block = {
                'type': 'code_block',
                'language': language,
                'code': '\n'.join(code_lines)
            }
            
        # Blockquotes
        elif line.startswith('>'):
            if current_block and current_block.get('type') != 'quote':
                blocks.append(current_block)
                current_block = None
                
            quote_text = line[1:].strip()
            if not current_block:
                current_block = {
                    'type': 'quote',
                    'text': quote_text
                }
            else:
                current_block['text'] += '\n' + quote_text
                
        # Images (figures)
        elif line.startswith('!['):
            if current_block:
                blocks.append(current_block)
                
            # Extract alt text and URL
            alt_match = re.match(r'!\[([^\]]*)\]\(([^\)]+)\)', line)
            if alt_match:
                alt_text = alt_match.group(1)
                image_url = alt_match.group(2)
                current_block = {
                    'type': 'figure',
                    'caption': alt_text,
                    'image_url': image_url
                }
                
        # Tables
        elif '|' in line and not line.startswith('|'):
            if current_block:
                blocks.append(current_block)
                
            # Parse table
            table_lines = [line]
            i += 1
            
            # Get header separator and data rows
            while i < len(lines) and '|' in lines[i]:
                table_lines.append(lines[i])
                i += 1
            i -= 1  # Adjust for the extra increment
            
            if len(table_lines) >= 2:
                headers = [col.strip() for col in table_lines[0].split('|')[1:-1]]
                rows = []
                
                for row_line in table_lines[2:]:  # Skip header separator
                    row_data = [col.strip() for col in row_line.split('|')[1:-1]]
                    if len(row_data) == len(headers):
                        rows.append(row_data)
                        
                current_block = {
                    'type': 'table',
                    'columns': headers,
                    'rows': rows
                }
                
        # Equations (LaTeX)
        elif line.startswith('$$') or line.startswith('\\['):
            if current_block:
                blocks.append(current_block)
                
            equation_lines = [line]
            i += 1
            
            end_marker = '$$' if line.startswith('$$') else '\\]'
            while i < len(lines) and not lines[i].strip().endswith(end_marker):
                equation_lines.append(lines[i])
                i += 1
                
            if i < len(lines):
                equation_lines.append(lines[i])
                
            current_block = {
                'type': 'equation',
                'equation': '\n'.join(equation_lines)
            }
            
        # Regular paragraphs
        else:
            if current_block and current_block.get('type') != 'paragraph':
                blocks.append(current_block)
                current_block = None
                
            if not current_block:
                current_block = {
                    'type': 'paragraph',
                    'text': line
                }
            else:
                current_block['text'] += '\n' + line
                
        i += 1
        
    # Add the last block
    if current_block:
        blocks.append(current_block)
        
    return blocks


class IntoBlocksWorker:
    """
    A worker class that processes markdown content into structured blocks.
    """

    def __init__(self):
        self.processing_analysis_ids: List[PydanticObjectId] = []
        self.tasks: List[asyncio.Task] = []

    def start(self, event_loop: AbstractEventLoop = None) -> asyncio.Task:
        """
        Create a task for the worker loop in the provided event loop or the current one.
        
        :param event_loop: The event loop to run the worker in.
        :return: The created task.
        :rtype: asyncio.Task
        """
        logger.info("Starting IntoBlocksWorker")
        event_loop = event_loop or asyncio.get_event_loop()

        if not event_loop:
            event_loop = asyncio.new_event_loop()

        task = event_loop.create_task(self.loop())
        logger.info("IntoBlocksWorker task created and started")
        return task

    async def process_file(self, analysis: Analysis):
        """
        Process a single analysis file to extract blocks from markdown.
        
        :param analysis: The analysis object to process.
        """
        logger.info(f"Starting block processing for analysis {analysis.id}")
        self.processing_analysis_ids.append(analysis.id)

        try:
            logger.debug(f"Processing markdown into blocks for analysis {analysis.id}")

            # Parse markdown into blocks
            block_data = parse_markdown_blocks(analysis.processed_markdown)
            logger.info(f"Parsed {len(block_data)} blocks from markdown")

            # Create block objects and link them
            previous_block = None
            blocks = []
            
            for i, block_info in enumerate(block_data):
                block_obj = await self._create_block_from_data(block_info, analysis.paper, i + 1)
                
                if block_obj:
                    blocks.append(block_obj)
                    
                    # Link to previous block
                    if previous_block:
                        previous_block.next_block = block_obj
                        await previous_block.save(link_rule=WriteRules.WRITE)
                        
                    previous_block = block_obj

            logger.info(f"Created {len(blocks)} blocks for analysis {analysis.id}")

            # Update analysis status
            analysis.status = AnalysisStatus.COMPLETED
            await analysis.save(link_rule=WriteRules.WRITE)

            logger.info(f"Analysis {analysis.id} completed successfully")

        except Exception as e:
            logger.error(f"Failed to process file for analysis {analysis.id}: {str(e)}")
            analysis.status = AnalysisStatus.ERRORED
            await analysis.save(link_rule=WriteRules.WRITE)
            raise
        finally:
            self.processing_analysis_ids.remove(analysis.id)
            logger.debug(f"Removed analysis {analysis.id} from processing list")

    async def _create_block_from_data(self, block_info: dict, paper, block_number: int) -> Optional[Block]:
        """
        Create a block object from parsed block data.
        
        :param block_info: Dictionary containing block information.
        :param paper: The paper this block belongs to.
        :param block_number: The sequence number of this block.
        :return: Created block object or None if creation failed.
        :rtype: Optional[Block]
        """
        block_type = block_info['type']
        
        try:
            if block_type == 'header':
                block = Header(
                    kind=BlockKind.HEADER,
                    paper=paper,
                    level=block_info['level'],
                    text=block_info['text']
                )
                
            elif block_type == 'paragraph':
                block = Paragraph(
                    kind=BlockKind.PARAGRAPH,
                    paper=paper,
                    text=block_info['text']
                )
                
            elif block_type == 'figure':
                # Handle image upload if it's a data URL
                image_url = block_info['image_url']
                if image_url.startswith('data:image'):
                    # Extract base64 data and upload to S3
                    header, data = image_url.split(',', 1)
                    image_data = base64.b64decode(data)
                    image_name = f"figure_{block_number}.png"
                    image_url = await upload_image_to_bucket(image_data, str(paper.id), image_name)
                
                block = Figure(
                    kind=BlockKind.FIGURE,
                    paper=paper,
                    caption=block_info.get('caption'),
                    image_url=image_url,
                    figure_number=block_number
                )
                
            elif block_type == 'table':
                block = Table(
                    kind=BlockKind.TABLE,
                    paper=paper,
                    columns=block_info['columns'],
                    rows=block_info['rows']
                )
                
            elif block_type == 'equation':
                block = Equation(
                    kind=BlockKind.EQUATION,
                    paper=paper,
                    equation=block_info['equation']
                )
                
            elif block_type == 'code_block':
                block = CodeBlock(
                    kind=BlockKind.CODE_BLOCK,
                    paper=paper,
                    code=block_info['code'],
                    language=block_info.get('language')
                )
                
            elif block_type == 'quote':
                block = Quote(
                    kind=BlockKind.QUOTE,
                    paper=paper,
                    text=block_info['text']
                )
                
            else:
                logger.warning(f"Unknown block type: {block_type}")
                return None
                
            # Save the block
            await block.insert()
            logger.debug(f"Created {block_type} block with ID {block.id}")
            return block
            
        except Exception as e:
            logger.error(f"Failed to create block of type {block_type}: {str(e)}")
            return None

    async def loop(self):
        """
        Main worker loop that continuously processes analyses.
        """
        logger.info("Starting IntoBlocksWorker main loop")
        while True:
            try:
                analyses = await pull_existing_analyses()

                for analysis in analyses:
                    if analysis.id in self.processing_analysis_ids:
                        logger.debug(f"Skipping analysis {analysis.id} - already being processed")
                        continue

                    logger.info(f"Creating task for analysis {analysis.id}")
                    task = asyncio.create_task(self.process_file(analysis))
                    self.tasks.append(task)

            except Exception as e:
                logger.error(f"Error in IntoBlocksWorker loop: {str(e)}")

            finally:
                await asyncio.sleep(5)

    async def close(self):
        """
        Shutdown the worker and cancel all running tasks.
        """
        logger.info("Shutting down IntoBlocksWorker")
        logger.info(f"Cancelling {len(self.tasks)} running tasks")
        for task in self.tasks:
            task.cancel()
        logger.info("IntoBlocksWorker shutdown complete")