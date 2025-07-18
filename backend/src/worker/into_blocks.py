import asyncio
from asyncio import AbstractEventLoop
from typing import List

from beanie import PydanticObjectId, WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.utils.blocks import create_block_from_info, save_and_link_block
from src.utils.markdown import (
    parse_markdown_to_blocks, MarkdownBlock
)

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


class IntoBlocksWorker:
    """
    A worker class that processes markdown content to create structured blocks.
    """

    def __init__(self):
        self.processing_analysis_ids: List[PydanticObjectId] = []
        self.tasks: List[asyncio.Task] = []

    def start(self, event_loop: AbstractEventLoop = None) -> asyncio.Task:
        """
        Create a task for the worker loop in the provided event loop or the current one.
        
        :param event_loop: Event loop to run the worker in.
        :return: The created asyncio task.
        :rtype: asyncio.Task
        """
        logger.info("Starting IntoBlocksWorker")
        event_loop = event_loop or asyncio.get_event_loop()

        if not event_loop:
            event_loop = asyncio.new_event_loop()

        task = event_loop.create_task(self.loop())
        logger.info("IntoBlocksWorker task created and started")
        return task

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

    async def process_file(self, analysis: Analysis):
        """
        Process analysis markdown content and create block structures.
        
        :param analysis: Analysis object containing processed markdown.
        """
        logger.info(f"Starting block generation for analysis {analysis.id}")
        self.processing_analysis_ids.append(analysis.id)

        try:
            await self._process_analysis(analysis)
        except Exception as e:
            logger.error(f"Failed to process blocks for analysis {analysis.id}: {str(e)}")
            raise
        finally:
            self.processing_analysis_ids.remove(analysis.id)
            logger.debug(f"Removed analysis {analysis.id} from processing list")

    async def _process_analysis(self, analysis: Analysis):
        """
        Internal method to process analysis without error handling.
        
        :param analysis: Analysis object to process.
        """
        logger.debug(f"Processing markdown into blocks for analysis {analysis.id}")

        block_data = parse_markdown_to_blocks(analysis.processed_markdown)
        logger.info(f"Parsed {len(block_data)} blocks for analysis {analysis.id}")

        await self._process_blocks(block_data, analysis.paper)

        analysis.status = AnalysisStatus.COMPLETED
        await analysis.save(link_rule=WriteRules.WRITE)

        logger.info(f"Analysis {analysis.id} processed into blocks and status updated to COMPLETED")

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
