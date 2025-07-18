import asyncio
from typing import List

from beanie import WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.utils.blocks import create_block_from_info, save_and_link_block
from src.utils.markdown import (
    parse_markdown_to_blocks, MarkdownBlock
)
from src.worker.base import BaseWorker

logger = get_logger(__name__)


class IntoBlocksWorker(BaseWorker):
    """
    A worker class that processes markdown content to create structured blocks.
    """

    def __init__(self):
        super().__init__()

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.
        
        :return: AnalysisStatus.METADATA_GENERATED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.METADATA_GENERATED

    async def _process_blocks(self, block_data: List[MarkdownBlock], paper):
        """
        Process and create all blocks from block data.
        
        :param block_data: List of block information dictionaries.
        :param paper: Paper reference.
        """
        previous_block = None

        for block_info in block_data:
            block = await create_block_from_info(block_info, paper)

            if not block:
                continue

            previous_block = await save_and_link_block(
                block, previous_block, block_info['type']
            )

    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis by converting markdown into blocks.
        
        :param analysis: The analysis to process.
        """
        logger.info(f"Starting block generation for analysis {analysis.id}")
        logger.debug(f"Processing markdown into blocks for analysis {analysis.id}")

        block_data = parse_markdown_to_blocks(analysis.processed_markdown)
        logger.info(f"Parsed {len(block_data)} blocks for analysis {analysis.id}")

        await self._process_blocks(block_data, analysis.paper)

        analysis.status = AnalysisStatus.COMPLETED
        await analysis.save(link_rule=WriteRules.WRITE)

        logger.info(f"Analysis {analysis.id} processed into blocks and status updated to COMPLETED")
