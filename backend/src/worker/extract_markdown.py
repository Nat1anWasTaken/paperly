import asyncio
from io import BytesIO

from PIL import Image
from beanie import WriteRules
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.storage.s3 import bucket_name, storage_client
from src.utils.images import process_images_and_update_markdown
from src.worker.base import BaseWorker

logger = get_logger(__name__)


def download_file_from_bucket(file_key: str) -> BytesIO:
    """
    Download file from S3 bucket.

    :param file_key: S3 key of the file to download
    :return: BytesIO object containing the file content
    :raises Exception: If download fails
    """
    logger.info(f"Downloading file from S3 bucket with key: {file_key}")

    try:
        response = storage_client.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response["Body"].read()
        file_size = len(file_content)
        logger.info(f"Successfully downloaded file {file_key} ({file_size} bytes)")
        return BytesIO(file_content)

    except Exception as e:
        logger.error(
            f"Failed to download file with key '{file_key}' from bucket: {str(e)}"
        )
        raise Exception(
            f"Failed to download file with key '{file_key}' from bucket: {str(e)}"
        )


def debug_images_data(images):
    """
    Debug function to log detailed information about extracted images.

    :param images: Dictionary of images from marker
    """
    if not images:
        logger.info("No images extracted by marker")
        return

    logger.info(f"Marker extracted {len(images)} images:")
    for filename, data in images.items():
        if isinstance(data, Image.Image):
            logger.info(f"  - {filename}: PIL Image {data.size} ({data.mode})")
        elif isinstance(data, bytes):
            data_size = len(data)
            preview = data[:20].hex() if len(data) >= 20 else data.hex()
            logger.info(f"  - {filename}: {data_size} bytes, starts with: {preview}")
        else:
            logger.warning(f"  - {filename}: unexpected data type {type(data)}")


class MarkdownExtractionWorker(BaseWorker):
    def __init__(self):
        super().__init__()
        self.converter = PdfConverter(artifact_dict=create_model_dict())

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.

        :return: AnalysisStatus.CREATED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.CREATED

    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis by extracting markdown from the PDF.

        :param analysis: The analysis to process.
        """
        logger.info(f"Starting markdown extraction for analysis {analysis.id}")

        analysis.status = AnalysisStatus.EXTRACTING_MARKDOWN
        await analysis.save(link_rule=WriteRules.WRITE)

        try:
            # Download PDF file from S3
            file_object = download_file_from_bucket(analysis.file_key)
            logger.debug(
                f"File downloaded for analysis {analysis.id}, converting to markdown"
            )

            # Convert PDF to markdown in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            rendered = self.converter(file_object)

            logger.debug(
                f"PDF conversion completed for analysis {analysis.id}, extracting text and images"
            )
            markdown_content, _, images = await loop.run_in_executor(
                None, text_from_rendered, rendered
            )

            markdown_length = len(markdown_content) if markdown_content else 0
            image_count = len(images) if images else 0

            logger.info(
                f"Markdown extraction completed for analysis {analysis.id} "
                f"({markdown_length} characters, {image_count} images)"
            )

            # Debug images data
            debug_images_data(images)

            # Process images and update markdown with S3 URLs
            if images:
                logger.info(
                    f"Processing {len(images)} images for analysis {analysis.id}"
                )
                updated_markdown = process_images_and_update_markdown(
                    markdown_content,
                    images,
                    str(analysis.id),  # Pass analysis ID for organized S3 structure
                )
            else:
                logger.info(f"No images to process for analysis {analysis.id}")
                updated_markdown = markdown_content

            # Update analysis with extracted markdown
            analysis.status = AnalysisStatus.MARKDOWN_EXTRACTED
            analysis.processed_markdown = updated_markdown
            await analysis.save(link_rule=WriteRules.WRITE)

            logger.info(
                f"Analysis {analysis.id} updated with extracted markdown and status changed to MARKDOWN_EXTRACTED"
            )

        except Exception as e:
            logger.error(f"Failed to process analysis {analysis.id}: {str(e)}")
            analysis.status = AnalysisStatus.ERRORED
            analysis.error_message = str(e)
            await analysis.save(link_rule=WriteRules.WRITE)
            raise
