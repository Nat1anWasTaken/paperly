import asyncio
import re
import uuid
from io import BytesIO

from beanie import WriteRules
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered

from src.config import settings
from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.storage.s3 import bucket_name
from src.storage.s3 import storage_client
from src.worker.base import BaseWorker

logger = get_logger(__name__)


def download_file_from_bucket(file_key: str) -> BytesIO:
    logger.info(f"Downloading file from S3 bucket with key: {file_key}")

    try:
        response = storage_client.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response['Body'].read()
        file_size = len(file_content)
        logger.info(f"Successfully downloaded file {file_key} ({file_size} bytes)")
        return BytesIO(file_content)

    except Exception as e:
        logger.error(f"Failed to download file with key '{file_key}' from bucket: {str(e)}")
        raise Exception(f"Failed to download file with key '{file_key}' from bucket: {str(e)}")


def upload_image_to_bucket(image_data: bytes, file_extension: str) -> str:
    image_uuid = str(uuid.uuid4())
    image_key = f"images/{image_uuid}.{file_extension}"
    logger.info(f"Uploading image to S3 bucket with key: {image_key}")

    try:
        storage_client.put_object(
            Bucket=bucket_name,
            Key=image_key,
            Body=image_data,
            ContentType=f"image/{file_extension}"
        )
        logger.info(f"Successfully uploaded image {image_key} ({len(image_data)} bytes)")
        return image_key

    except Exception as e:
        logger.error(f"Failed to upload image with key '{image_key}' to bucket: {str(e)}")
        raise Exception(f"Failed to upload image with key '{image_key}' to bucket: {str(e)}")


def process_images_and_update_markdown(markdown_content: str, images: dict) -> str:
    if not images:
        logger.info("No images found in the document")
        return markdown_content

    logger.info(f"Processing {len(images)} images from the document")
    updated_markdown = markdown_content
    for original_filename, image_data in images.items():
        try:
            file_extension = original_filename.split('.')[-1].lower()
            if file_extension not in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']:
                file_extension = 'png'

            image_key = upload_image_to_bucket(image_data, file_extension)
            if settings.s3.endpoint_url:
                bucket_endpoint = f"{settings.s3.endpoint_url.rstrip('/')}/{bucket_name}"
            else:
                bucket_endpoint = f"https://{bucket_name}.s3.{settings.s3.region}.amazonaws.com"

            image_url = f"{bucket_endpoint}/{image_key}"
            pattern = rf'!\\[([^\\]*)\\]\\((?:{re.escape(original_filename)})\\)'
            replacement = rf'![\\1]({image_url})'
            updated_markdown = re.sub(pattern, replacement, updated_markdown)
            logger.info(f"Updated markdown references for image {original_filename} -> {image_url}")
        except Exception as e:
            logger.error(f"Failed to process image {original_filename}: {str(e)}")

    return updated_markdown


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
        
        file_object = download_file_from_bucket(analysis.file_key)
        logger.debug(f"File downloaded for analysis {analysis.id}, converting to markdown")

        loop = asyncio.get_event_loop()

        rendered = self.converter(file_object)
        markdown_content, _, images = await loop.run_in_executor(None, text_from_rendered, rendered)
        markdown_length = len(markdown_content) if markdown_content else 0

        logger.info(f"Markdown extraction completed for analysis {analysis.id} ({markdown_length} characters)")

        updated_markdown = process_images_and_update_markdown(markdown_content, images)

        analysis.status = AnalysisStatus.MARKDOWN_EXTRACTED
        analysis.processed_markdown = updated_markdown
        await analysis.save(link_rule=WriteRules.WRITE)

        logger.info(
            f"Analysis {analysis.id} updated with extracted markdown and status changed to MARKDOWN_EXTRACTED")
