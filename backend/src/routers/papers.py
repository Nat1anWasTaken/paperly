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


class FileUploadRequest(BaseModel):
    """
    Request model for file upload endpoint.

    :param content_type: MIME type of the file to be uploaded.
    """
    content_type: str = "application/pdf"


class FileUploadResponse(BaseModel):
    """
    Response model for file upload endpoint.

    :param paper_id: Unique identifier for the paper.
    :param upload_url: Pre-signed URL for file upload.
    :param key: S3 object key for the uploaded file.
    """
    paper_id: str
    upload_url: str
    key: str


@router.post("/file", response_model=FileUploadResponse)
async def upload_paper_file(request: FileUploadRequest):
    """
    Obtain a pre-signed URL for uploading a paper file to service's bucket. You must upload the file before creating a analysis task.
    
    :param request: File upload request containing content type.
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
            'ContentType': request.content_type
        },
        ExpiresIn=3600
    )

    return FileUploadResponse(
        paper_id=paper_id,
        upload_url=presigned_url,
        key=key
    )
