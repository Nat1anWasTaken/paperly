import re
import uuid
from io import BytesIO
from typing import Dict, Optional, Union

from PIL import Image

from src.config import settings
from src.logging import get_logger
from src.storage.s3 import bucket_name, storage_client

logger = get_logger(__name__)


def pil_image_to_bytes(image: Image.Image, format: str = "PNG") -> bytes:
    """
    Convert PIL Image to bytes.

    :param image: PIL Image object
    :param format: Output format (PNG, JPEG, etc.)
    :return: Image as bytes
    """
    buffer = BytesIO()

    # Convert RGBA to RGB for JPEG format
    if format.upper() == "JPEG" and image.mode in ("RGBA", "LA", "P"):
        # Create white background
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode == "P":
            image = image.convert("RGBA")
        background.paste(
            image, mask=image.split()[-1] if image.mode == "RGBA" else None
        )
        image = background

    image.save(buffer, format=format)
    return buffer.getvalue()


def validate_image_data(image_data: Union[bytes, Image.Image], filename: str) -> bool:
    """
    Validate that image data is actually image content.

    :param image_data: Image binary data or PIL Image object
    :param filename: Original filename for logging
    :return: True if data appears to be a valid image
    """
    # Handle PIL Image objects
    if isinstance(image_data, Image.Image):
        logger.info(
            f"Image data for {filename} is PIL Image: {image_data.size} {image_data.mode}"
        )
        return True

    if not isinstance(image_data, bytes):
        logger.warning(
            f"Image data for {filename} is not bytes or PIL Image: {type(image_data)}"
        )
        return False

    if len(image_data) < 100:  # Very small files are likely not real images
        logger.warning(
            f"Image data for {filename} is too small: {len(image_data)} bytes"
        )
        return False

    # Check for common image file signatures
    image_signatures = {
        b"\xff\xd8\xff": "JPEG",
        b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "PNG",
        b"\x47\x49\x46\x38": "GIF",
        b"\x42\x4d": "BMP",
        b"\x52\x49\x46\x46": "WEBP",  # Partial signature
    }

    for signature, format_name in image_signatures.items():
        if image_data.startswith(signature):
            logger.info(
                f"Detected {format_name} image format for {filename} ({len(image_data)} bytes)"
            )
            return True

    # Log the first few bytes for debugging
    preview = image_data[:20].hex() if len(image_data) >= 20 else image_data.hex()
    logger.warning(f"Unknown image format for {filename}. First bytes: {preview}")
    return False


def upload_image_to_s3(
    image_data: Union[bytes, Image.Image], file_extension: str
) -> str:
    """
    Upload image data to S3 bucket and return the S3 key.

    :param image_data: Image binary data or PIL Image object
    :param file_extension: File extension (e.g., 'png', 'jpeg')
    :return: S3 key of the uploaded image
    :raises Exception: If upload fails
    """
    # Convert PIL Image to bytes if necessary
    if isinstance(image_data, Image.Image):
        # Determine format based on extension
        if file_extension.lower() in ("jpg", "jpeg"):
            format_name = "JPEG"
        elif file_extension.lower() == "png":
            format_name = "PNG"
        else:
            format_name = "PNG"  # Default to PNG
            file_extension = "png"

        logger.info(f"Converting PIL Image to {format_name} bytes")
        image_bytes = pil_image_to_bytes(image_data, format_name)
    else:
        image_bytes = image_data

    image_uuid = str(uuid.uuid4())
    image_key = f"images/{image_uuid}.{file_extension}"

    logger.info(
        f"Uploading image to S3 with key: {image_key} ({len(image_bytes)} bytes)"
    )

    try:
        storage_client.put_object(
            Bucket=bucket_name,
            Key=image_key,
            Body=image_bytes,
            ContentType=f"image/{file_extension}",
        )
        logger.info(f"Successfully uploaded image {image_key}")
        return image_key

    except Exception as e:
        logger.error(f"Failed to upload image with key '{image_key}': {str(e)}")
        raise Exception(f"Failed to upload image with key '{image_key}': {str(e)}")


def get_s3_image_url(image_key: str) -> str:
    """
    Generate the full S3 URL for an image key.

    :param image_key: S3 key of the image
    :return: Full S3 URL
    """
    if settings.s3.endpoint_url:
        bucket_endpoint = f"{settings.s3.endpoint_url.rstrip('/')}/{bucket_name}"
    else:
        bucket_endpoint = f"https://{bucket_name}.s3.{settings.s3.region}.amazonaws.com"

    return f"{bucket_endpoint}/{image_key}"


def process_images_and_update_markdown(
    markdown_content: str,
    images: Dict[str, Union[bytes, Image.Image]],
    analysis_id: Optional[str] = None,
) -> str:
    """
    Process images extracted from PDF and update markdown content with S3 URLs.

    :param markdown_content: Original markdown content
    :param images: Dictionary mapping image filenames to image data (bytes or PIL Images)
    :param analysis_id: Optional analysis ID (not used for image organization anymore)
    :return: Updated markdown content with S3 image URLs
    """
    if not images:
        logger.info("No images found in the document")
        return markdown_content

    logger.info(f"Processing {len(images)} images from the document")
    updated_markdown = markdown_content
    processed_count = 0
    skipped_count = 0

    for original_filename, image_data in images.items():
        try:
            logger.debug(f"Processing image: {original_filename}")

            # Validate image data
            if not validate_image_data(image_data, original_filename):
                logger.warning(f"Skipping invalid image data for {original_filename}")
                skipped_count += 1
                continue

            # Extract and normalize file extension
            file_extension = normalize_image_extension(original_filename)

            # Upload image to S3 (simplified path structure)
            image_key = upload_image_to_s3(image_data, file_extension)
            image_url = get_s3_image_url(image_key)

            # Replace image references in markdown
            # Pattern 1: Standard markdown image format
            pattern1 = rf"!\[([^\]]*)\]\({re.escape(original_filename)}\)"
            replacement = rf"![\1]({image_url})"
            count1 = len(re.findall(pattern1, updated_markdown))
            updated_markdown = re.sub(pattern1, replacement, updated_markdown)

            # Pattern 2: Image references with path prefixes
            pattern2 = rf"!\[([^\]]*)\]\([^)]*{re.escape(original_filename)}[^)]*\)"
            count2 = len(re.findall(pattern2, updated_markdown))
            updated_markdown = re.sub(pattern2, replacement, updated_markdown)

            # Pattern 3: Just the filename without markdown syntax (fallback)
            pattern3 = re.escape(original_filename)
            count3 = updated_markdown.count(original_filename)
            updated_markdown = re.sub(pattern3, image_url, updated_markdown)

            total_replacements = count1 + count2 + count3
            logger.info(
                f"Processed image {original_filename} -> {image_url} ({total_replacements} replacements)"
            )
            processed_count += 1

        except Exception as e:
            logger.error(f"Failed to process image {original_filename}: {str(e)}")
            skipped_count += 1
            continue

    logger.info(
        f"Image processing completed: {processed_count} processed, {skipped_count} skipped"
    )
    return updated_markdown


def normalize_image_extension(filename: str) -> str:
    """
    Normalize image file extension.

    :param filename: Original filename
    :return: Normalized extension
    """
    if "." not in filename:
        return "png"

    extension = filename.split(".")[-1].lower()

    # Map common variations to standard extensions
    extension_map = {"jpg": "jpeg", "tif": "tiff", "tiff": "tiff"}

    normalized = extension_map.get(extension, extension)

    # Ensure it's a valid image extension
    valid_extensions = {"png", "jpeg", "gif", "bmp", "webp", "tiff"}
    if normalized not in valid_extensions:
        logger.warning(
            f"Unknown extension '{extension}' for {filename}, defaulting to 'png'"
        )
        return "png"

    return normalized
