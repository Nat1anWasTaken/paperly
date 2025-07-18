import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from src.storage.s3 import storage_client, bucket_name

router = APIRouter(prefix="/papers")


@router.post("/")
async def create_paper():
    """
    Returns a
    :return:
    """
    pass


class FileUploadResponse(BaseModel):
    """
    Response model for file upload endpoint.
    .
    :param upload_url: Pre-signed URL for file upload.
    :param key: S3 object key for the uploaded file.
    """
    upload_url: str
    key: str


@router.get("/upload_url", response_model=FileUploadResponse)
async def get_upload_url():
    """
    Obtain a pre-signed URL for uploading a paper file to service's bucket. You must upload the file before creating a analysis task.

    :return: Pre-signed URL for file upload.
    :rtype: FileUploadResponse
    """
    paper_id = str(uuid.uuid4())
    key = f"papers/{paper_id}.pdf"

    presigned_url = storage_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket_name,
            'Key': key,
            'ContentType': "application/pdf"
        },
        ExpiresIn=3600
    )

    return FileUploadResponse(
        upload_url=presigned_url,
        key=key
    )
