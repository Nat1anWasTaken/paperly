import base64
import uuid
from typing import Optional, List

from beanie import WriteRules, PydanticObjectId

from src.logging import get_logger
from src.models.block import Header, BlockKind, Figure, Paragraph, Table, Equation, CodeBlock, Quote, Block
from src.storage.s3 import storage_client, bucket_name
from src.utils.markdown import HeaderBlock, FigureBlock, ParagraphBlock, TableBlock, EquationBlock, CodeBlock, \
    QuoteBlock, MarkdownBlock

logger = get_logger(__name__)


async def upload_image_to_s3(image_url: str, paper_id: str) -> Optional[str]:
    """
    Upload image to S3 bucket and return the new URL.

    :param image_url: Original image URL or base64 data.
    :param paper_id: ID of the paper for organizing files.
    :return: S3 URL of the uploaded image or None if upload fails.
    :rtype: Optional[str]
    """
    try:
        # Generate unique filename
        image_id = str(uuid.uuid4())
        key = f"papers/{paper_id}/images/{image_id}.png"

        # Handle base64 images
        if image_url.startswith('data:image'):
            # Extract base64 data
            header, data = image_url.split(',', 1)
            image_data = base64.b64decode(data)

            # Upload to S3
            storage_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=image_data,
                ContentType='image/png'
            )

            # Return S3 URL
            s3_url = f"https://{bucket_name}.s3.amazonaws.com/{key}"
            logger.info(f"Uploaded base64 image to S3: {s3_url}")
            return s3_url

        # For now, return original URL for external images
        # TODO: Download and re-upload external images if needed
        return image_url

    except Exception as e:
        logger.error(f"Failed to upload image to S3: {str(e)}")
        return None


async def create_header_block(block_info: HeaderBlock, paper) -> Header:
    """
    Create a header block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Header block.
    :rtype: Header
    """
    return Header(
        kind=BlockKind.HEADER,
        paper=paper,
        level=block_info['level'],
        text=block_info['text']
    )


async def create_figure_block(block_info: FigureBlock, paper) -> Figure:
    """
    Create a figure block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Figure block.
    :rtype: Figure
    """
    image_url = block_info['image_url']
    if image_url and image_url.startswith('data:image'):
        image_url = await upload_image_to_s3(image_url, str(paper.id))

    return Figure(
        kind=BlockKind.FIGURE,
        paper=paper,
        caption=block_info.get('caption'),
        image_url=image_url
    )


async def create_paragraph_block(block_info: ParagraphBlock, paper) -> Paragraph:
    """
    Create a paragraph block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Paragraph block.
    :rtype: Paragraph
    """
    return Paragraph(
        kind=BlockKind.PARAGRAPH,
        paper=paper,
        text=block_info['text']
    )


async def create_table_block(block_info: TableBlock, paper) -> Table:
    """
    Create a table block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Table block.
    :rtype: Table
    """
    return Table(
        kind=BlockKind.TABLE,
        paper=paper,
        columns=block_info['columns'],
        rows=block_info['rows']
    )


async def create_equation_block(block_info: EquationBlock, paper) -> Equation:
    """
    Create an equation block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Equation block.
    :rtype: Equation
    """
    return Equation(
        kind=BlockKind.EQUATION,
        paper=paper,
        equation=block_info['equation']
    )


async def create_code_block(block_info: CodeBlock, paper) -> CodeBlock:
    """
    Create a code block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created CodeBlock block.
    :rtype: CodeBlock
    """
    return CodeBlock(
        kind=BlockKind.CODE_BLOCK,
        paper=paper,
        code=block_info['code'],
        language=block_info.get('language')
    )


async def create_quote_block(block_info: QuoteBlock, paper) -> Quote:
    """
    Create a quote block from block info.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created Quote block.
    :rtype: Quote
    """
    return Quote(
        kind=BlockKind.QUOTE,
        paper=paper,
        text=block_info['text']
    )


async def create_block_from_info(block_info: MarkdownBlock, paper):
    """
    Create a block object from block info dictionary.

    :param block_info: Dictionary containing block information.
    :param paper: Paper reference.
    :return: Created block object or None if type not supported.
    """
    block_type = block_info['type']

    block_creators = {
        'header': create_header_block,
        'paragraph': create_paragraph_block,
        'figure': create_figure_block,
        'table': create_table_block,
        'equation': create_equation_block,
        'code_block': create_code_block,
        'quote': create_quote_block
    }

    creator = block_creators.get(block_type)
    if creator:
        return await creator(block_info, paper)

    logger.warning(f"Unknown block type: {block_type}")
    return None


async def save_and_link_block(block: Block, previous_block: Block, block_type: str):
    """
    Save block to database and link to previous block.

    :param block: Block object to save.
    :param previous_block: Previous block to link to.
    :param block_type: Type of block for logging.
    :return: The saved block.
    """
    await block.insert()
    logger.debug(f"Created {block_type} block {block.id}")

    if previous_block:
        previous_block.next_block = block
        await previous_block.save(link_rule=WriteRules.WRITE)

    return block


async def get_blocks_in_order(paper_id: PydanticObjectId) -> List[Block]:
    """
    Retrieve all blocks for a given paper ID in order.

    :param paper_id: ID of the paper to retrieve blocks for.
    :return: List of block objects.
    :rtype: List[Block]
    """
    all_blocks = await Block.find(Block.paper == paper_id).to_list()
    
    if not all_blocks:
        return []

    next_block_ids = {block.next_block.ref.id for block in all_blocks if block.next_block}
    first_block = next(block for block in all_blocks if block.id not in next_block_ids)

    ordered_blocks = []
    current_block = first_block
    
    while current_block:
        ordered_blocks.append(current_block)
        if current_block.next_block:
            current_block = next((block for block in all_blocks if block.id == current_block.next_block.ref.id), None)
        else:
            current_block = None
    
    return ordered_blocks


async def insert_block_after(block: Block, after: Block) -> Block:
    """
    Insert a new block onto a existing chain of blocks.

    :param block: Block object to insert.
    :param after: Block object after which to insert the new block.
    :return: The inserted block.
    """
    if not after:
        raise ValueError("You must provide a valid 'after' block to insert the new block.")

    original_next_block = after.next_block
    block.next_block = original_next_block
    await block.insert()
    logger.debug(f"Created block {block.id} of type {block.kind} after block {after.id} of type {after.kind}")

    after.next_block = block
    await after.save(link_rule=WriteRules.WRITE)

    return block
