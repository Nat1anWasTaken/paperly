import asyncio
from abc import ABC, abstractmethod
from asyncio import AbstractEventLoop
from typing import List

from beanie import PydanticObjectId

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus

logger = get_logger(__name__)


class BaseWorker(ABC):
    """
    Base class for all workers that provides common functionality.
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
        worker_name = self.__class__.__name__
        logger.info(f"Starting {worker_name}")
        event_loop = event_loop or asyncio.get_event_loop()

        if not event_loop:
            event_loop = asyncio.new_event_loop()

        task = event_loop.create_task(self.loop())
        logger.info(f"{worker_name} task created and started")
        return task

    async def close(self):
        """
        Shutdown the worker and cancel all running tasks.
        """
        worker_name = self.__class__.__name__
        logger.info(f"Shutting down {worker_name}")
        logger.info(f"Cancelling {len(self.tasks)} running tasks")
        for task in self.tasks:
            task.cancel()
        logger.info(f"{worker_name} shutdown complete")

    @abstractmethod
    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.
        
        :return: The target status to query for.
        :rtype: AnalysisStatus
        """
        pass

    @abstractmethod
    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis. This method should contain the specific
        processing logic for each worker type.
        
        :param analysis: The analysis to process.
        """
        pass

    async def pull_existing_analyses(self) -> List[Analysis]:
        """
        Pull existing analyses from the database based on the target status.
        
        :return: List of Analysis objects with the target status.
        :rtype: List[Analysis]
        """
        target_status = self.get_target_status()
        logger.debug(f"Querying for analyses with {target_status.value} status")

        analyses = await Analysis.find({
            "status": target_status
        }).to_list()

        logger.info(f"Found {len(analyses)} analyses in {target_status.value} status")
        return analyses

    async def process_file(self, analysis: Analysis):
        """
        Process a single analysis with error handling.
        
        :param analysis: The analysis to process.
        """
        logger.info(f"Starting processing for analysis {analysis.id}")
        self.processing_analysis_ids.append(analysis.id)

        try:
            await self.process_analysis(analysis)
        except Exception as e:
            logger.error(f"Failed to process analysis {analysis.id}: {str(e)}")
            try:
                await analysis.set({
                    "status": AnalysisStatus.ERRORED,
                    "error_message": str(e)
                })
                logger.info(f"Analysis {analysis.id} status set to ERRORED with error message")
            except Exception as update_error:
                logger.error(f"Failed to update analysis {analysis.id} status to ERRORED: {str(update_error)}")
        finally:
            self.processing_analysis_ids.remove(analysis.id)
            logger.debug(f"Removed analysis {analysis.id} from processing list")

    async def loop(self):
        """
        Main worker loop that continuously processes analyses.
        """
        worker_name = self.__class__.__name__
        logger.info(f"Starting {worker_name} main loop")
        while True:
            try:
                analyses = await self.pull_existing_analyses()

                for analysis in analyses:
                    if analysis.id in self.processing_analysis_ids:
                        logger.debug(f"Skipping analysis {analysis.id} - already being processed")
                        continue

                    logger.info(f"Creating task for analysis {analysis.id}")
                    task = asyncio.create_task(self.process_file(analysis))
                    self.tasks.append(task)

            except Exception as e:
                logger.error(f"Error in {worker_name} loop: {str(e)}")

            finally:
                await asyncio.sleep(5)