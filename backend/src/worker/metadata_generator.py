import asyncio
import re
from asyncio import AbstractEventLoop

from beanie import PydanticObjectId, WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.models.paper import Paper

logger = get_logger(__name__)


def extract_first_biggest_heading(markdown_content: str) -> str:
    """
    Extract the first, biggest heading from markdown content.

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


async def pull_existing_analyses() -> list[Analysis]:
    """
    Pull existing tasks from the database that are in the MARKDOWN_EXTRACTED status.
    :return: List of Analysis objects with status MARKDOWN_EXTRACTED.
    """
    logger.debug("Querying for analyses with MARKDOWN_EXTRACTED status")

    analyses = await Analysis.find({
        "status": AnalysisStatus.MARKDOWN_EXTRACTED
    }).to_list()

    logger.info(f"Found {len(analyses)} analyses in MARKDOWN_EXTRACTED status")

    return analyses


class MetadataGeneratorWorker:
    """
    A worker class that processes markdown texts to generate metadata.
    """

    def __init__(self):
        self.processing_analysis_ids: list[PydanticObjectId] = []
        self.tasks: list[asyncio.Task] = []

    def start(self, event_loop: AbstractEventLoop = None) -> asyncio.Task:
        """
        Create a task for the worker loop in the provided event loop or the current one.
        :return:
        """
        logger.info("Starting MetadataGeneratorWorker")
        event_loop = event_loop or asyncio.get_event_loop()

        if not event_loop:
            event_loop = asyncio.new_event_loop()

        task = event_loop.create_task(self.loop())
        logger.info("MetadataGeneratorWorker task created and started")
        return task

    async def process_file(self, analysis: Analysis):
        logger.info(f"Starting metadata generation for analysis {analysis.id}")
        self.processing_analysis_ids.append(analysis.id)

        try:
            logger.debug(f"Processing markdown for analysis {analysis.id}")

            # Extract title from the first, biggest heading
            title = extract_first_biggest_heading(analysis.processed_markdown)
            logger.info(f"Extracted title: '{title}' for analysis {analysis.id}")

            # Create a Paper object for the uploaded paper
            paper = Paper(
                title=title
            )
            
            # Save the paper to the database
            await paper.insert()
            logger.info(f"Created paper {paper.id} with title '{title}'")

            # Update the analysis with the paper ID and status
            # noinspection PyTypeChecker
            analysis.paper = paper
            analysis.status = AnalysisStatus.METADATA_GENERATED
            await analysis.save(link_rule=WriteRules.WRITE)

            logger.info(
                f"Analysis {analysis.id} updated with paper_id {paper.id} and status changed to METADATA_GENERATED")

        except Exception as e:
            logger.error(f"Failed to process file for analysis {analysis.id}: {str(e)}")
            raise
        finally:
            self.processing_analysis_ids.remove(analysis.id)
            logger.debug(f"Removed analysis {analysis.id} from processing list")

    async def loop(self):
        logger.info("Starting MetadataGeneratorWorker main loop")
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
                logger.error(f"Error in MetadataGeneratorWorker loop: {str(e)}")

            finally:
                await asyncio.sleep(5)

    async def close(self):
        logger.info("Shutting down MetadataGeneratorWorker")
        logger.info(f"Cancelling {len(self.tasks)} running tasks")
        for task in self.tasks:
            task.cancel()
        logger.info("MetadataGeneratorWorker shutdown complete")
