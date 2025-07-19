import asyncio
import json
import subprocess
import tempfile
from io import BytesIO
from pathlib import Path

from PIL import Image
from beanie import WriteRules

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

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.

        :return: AnalysisStatus.CREATED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.CREATED

    async def _process_pdf_in_subprocess(
        self, file_object: BytesIO, analysis_id: str
    ) -> tuple[str, dict]:
        """
        Process PDF in a subprocess to avoid segmentation faults.

        :param file_object: BytesIO object containing PDF data
        :param analysis_id: Analysis ID for logging
        :return: Tuple of (markdown_content, images)
        """
        import pickle

        logger.debug(f"Starting subprocess PDF processing for analysis {analysis_id}")

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Save PDF to temporary file
            pdf_path = temp_path / "input.pdf"
            with open(pdf_path, "wb") as f:
                f.write(file_object.getvalue())

            # Set output base path
            output_base = temp_path / "output"

            # Get path to PDF processor script
            processor_script = (
                Path(__file__).parent.parent / "utils" / "pdf_processor.py"
            )

            # Run PDF processing in subprocess
            try:
                process = await asyncio.create_subprocess_exec(
                    "python",
                    str(processor_script),
                    str(pdf_path),
                    str(output_base),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )

                stdout, stderr = await process.communicate()

                if process.returncode != 0:
                    error_msg = (
                        stderr.decode() if stderr else "Unknown subprocess error"
                    )
                    raise Exception(f"PDF processing subprocess failed: {error_msg}")

                logger.debug(
                    f"Subprocess completed for analysis {analysis_id}: {stdout.decode().strip()}"
                )

                # Read results
                metadata_path = temp_path / "output_metadata.json"
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)

                if not metadata.get("success", False):
                    raise Exception(
                        f"PDF processing failed: {metadata.get('error', 'Unknown error')}"
                    )

                # Read markdown content
                markdown_path = temp_path / "output.md"
                with open(markdown_path, "r", encoding="utf-8") as f:
                    markdown_content = f.read()

                # Read images data
                images_path = temp_path / "output_images.pkl"
                with open(images_path, "rb") as f:
                    images = pickle.load(f)

                logger.debug(
                    f"Successfully loaded results for analysis {analysis_id}: "
                    f"{len(markdown_content)} chars, {len(images)} images"
                )

                return markdown_content, images

            except Exception as e:
                logger.error(
                    f"Failed to process PDF in subprocess for analysis {analysis_id}: {str(e)}"
                )
                raise

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

            # Process PDF in subprocess to avoid segmentation faults
            markdown_content, images = await self._process_pdf_in_subprocess(
                file_object, str(analysis.id)
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
