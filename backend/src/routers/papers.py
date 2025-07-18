import uuid
from typing import List

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from src.logging import get_logger
from src.models.block import Block, BlockMixin
from src.models.paper import Paper
from src.storage.s3 import storage_client, bucket_name
from src.utils.blocks import get_blocks_in_order
from src.utils.object_id import validate_object_id_or_raise_http_exception

logger = get_logger(__name__)

router = APIRouter(prefix="/papers")


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


@router.get("/", response_model=List[Paper])
async def get_papers():
    """
    Retrieve all papers from the database.

    :return: List of all papers.
    :rtype: List[Paper]
    """
    papers = await Paper.find_all().to_list()
    return papers


@router.get("/{paper_id}", response_model=Paper)
async def get_paper(paper_id: str):
    """
    Retrieve a specific paper by its ID.

    :param paper_id: The unique identifier of the paper.
    :return: The paper with the specified ID.
    :rtype: Paper
    :raises HTTPException: If the paper is not found.
    """
    paper_object_id = validate_object_id_or_raise_http_exception(paper_id)

    paper = await Paper.get(paper_object_id)

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    return paper

class PaperBlocksResponse(BaseModel):
    """
    Response model for retrieving blocks of a paper.
    """
    blocks: List[BlockMixin]

@router.get("/{paper_id}/blocks", response_model=PaperBlocksResponse)
async def get_paper_blocks(paper_id: str):
    """
    Retrieve all blocks of a specific paper by its ID.

    :param paper_id: The unique identifier of the paper.
    :return: A list of blocks associated with the paper.
    :rtype: PaperBlocksResponse
    :raises HTTPException: If the paper is not found.
    """
    paper_object_id = validate_object_id_or_raise_http_exception(paper_id)

    paper = await Paper.get(paper_object_id)

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    blocks = await get_blocks_in_order(paper_object_id)

    return PaperBlocksResponse(blocks=blocks)