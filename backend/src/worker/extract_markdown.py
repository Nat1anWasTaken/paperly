import asyncio
from asyncio import AbstractEventLoop
from io import BytesIO

from beanie import PydanticObjectId
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.storage.s3 import bucket_name
from src.storage.s3 import storage_client

logger = get_logger(__name__)


def download_file_from_bucket(file_key: str) -> BytesIO:
    """
    Download a file from the S3 bucket using the provided key into memory.
    
    The file is downloaded as a binary stream ready for processing with marker.
    File keys follow the pattern 'papers/{paper_id}.pdf' as generated in the papers router.
    
    :param file_key: The S3 object key for the file to download (e.g., 'papers/uuid.pdf').
    :return: A BytesIO stream containing the downloaded file content.
    :rtype: BytesIO
    :raises Exception: If the file cannot be downloaded from S3.
    """
    logger.info(f"Downloading file from S3 bucket with key: {file_key}")

    try:
        response = storage_client.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response['Body'].read()
        file_size = len(file_content)

        logger.info(f"Successfully downloaded file {file_key} ({file_size} bytes)")

        # Return as a BytesIO object for in-memory processing
        return BytesIO(file_content)

    except Exception as e:
        logger.error(f"Failed to download file with key '{file_key}' from bucket: {str(e)}")

        raise Exception(f"Failed to download file with key '{file_key}' from bucket: {str(e)}")


async def pull_existing_analyses() -> list[Analysis]:
    """
    Pull existing tasks from the database that are in the CREATED status.
    :return: List of Analysis objects with status CREATED.
    """
    logger.debug("Querying for analyses with CREATED status")

    analyses = await Analysis.find({
        "status": AnalysisStatus.CREATED
    }).to_list()

    logger.info(f"Found {len(analyses)} analyses in CREATED status")

    return analyses


class MarkdownExtractionWorker:
    """
    A worker class that processes uploaded pdf into markdown texts.
    """

    def __init__(self):
        self.processing_analysis_ids: list[PydanticObjectId] = []
        self.tasks: list[asyncio.Task] = []
        self.converter = PdfConverter(artifact_dict=create_model_dict())

    def start(self, event_loop: AbstractEventLoop = None) -> asyncio.Task:
        """
        Create a task for the worker loop in the provided event loop or the current one.
        :return:
        """
        logger.info("Starting MarkdownExtractionWorker")
        event_loop = event_loop or asyncio.get_event_loop()

        if not event_loop:
            event_loop = asyncio.new_event_loop()

        task = event_loop.create_task(self.loop())
        logger.info("MarkdownExtractionWorker task created and started")
        return task

    async def process_file(self, analysis: Analysis):
        logger.info(f"Starting markdown extraction for analysis {analysis.id}")
        self.processing_analysis_ids.append(analysis.id)

        try:
            file_object = download_file_from_bucket(analysis.file_key)
            logger.debug(f"File downloaded for analysis {analysis.id}, converting to markdown")

            # Convert the PDF to markdown using marker (in-memory processing)
            rendered = self.converter(file_object)
            markdown_content, _, images = text_from_rendered(rendered)
            markdown_length = len(markdown_content) if markdown_content else 0
            logger.info(f"Markdown extraction completed for analysis {analysis.id} ({markdown_length} characters)")

            await analysis.set({
                "processed_markdown": markdown_content,
                "status": AnalysisStatus.MARKDOWN_EXTRACTED
            })

            logger.info(
                f"Analysis {analysis.id} updated with extracted markdown and status changed to MARKDOWN_EXTRACTED")

        except Exception as e:
            logger.error(f"Failed to process file for analysis {analysis.id}: {str(e)}")
            raise
        finally:
            self.processing_analysis_ids.remove(analysis.id)
            logger.debug(f"Removed analysis {analysis.id} from processing list")

    async def loop(self):
        logger.info("Starting MarkdownExtractionWorker main loop")
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
                logger.error(f"Error in MarkdownExtractionWorker loop: {str(e)}")

            finally:
                await asyncio.sleep(5)

    async def close(self):
        logger.info("Shutting down MarkdownExtractionWorker")
        logger.info(f"Cancelling {len(self.tasks)} running tasks")
        for task in self.tasks:
            task.cancel()
        logger.info("MarkdownExtractionWorker shutdown complete")
