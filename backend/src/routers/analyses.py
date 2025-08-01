from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from beanie import Link
from src.models.analysis import Analysis, AnalysisStatus
from src.utils.object_id import validate_object_id_or_raise_http_exception

router = APIRouter(prefix="/analyses")


class CreateAnalysisRequest(BaseModel):
    """
    Request model for creating an analysis task.
    """

    file_key: str  # The file key for the uploaded paper file in S3. Reference to POST /papers/file.


class CreateAnalysisResponse(BaseModel):
    """
    Response model for analysis creation endpoint.
    """

    analysis_id: str
    status: AnalysisStatus = AnalysisStatus.CREATED
    message: str = "Analysis task created successfully."


@router.post("/")
async def create_analysis(request: CreateAnalysisRequest) -> CreateAnalysisResponse:
    """
    Endpoint to create a new analysis task.

    :param request: Request containing file key for the uploaded paper.
    :return: Response containing analysis ID and status.
    :rtype: CreateAnalysisResponse
    """
    analysis = Analysis(
        status=AnalysisStatus.CREATED, file_key=request.file_key, paper=None
    )

    await analysis.insert()

    return CreateAnalysisResponse(
        analysis_id=str(analysis.id),
    )


class GetAnalysisResponse(BaseModel):
    """
    Response model for retrieving an analysis task.
    """

    analysis_id: str
    status: AnalysisStatus
    file_key: str
    paper_id: Optional[str] = None


@router.get("/{analysis_id}", response_model=GetAnalysisResponse)
async def get_analysis(analysis_id: str) -> GetAnalysisResponse:
    """
    Retrieve an analysis task by its ID.

    :param analysis_id: Unique identifier of the analysis task.
    :return: Analysis details including status and file information.
    :rtype: GetAnalysisResponse
    """
    object_id = validate_object_id_or_raise_http_exception(analysis_id)

    analysis = await Analysis.get(object_id)

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if isinstance(analysis.paper, Link):
        paper_id = str(analysis.paper.ref.id)
    else:
        paper_id = None

    return GetAnalysisResponse(
        analysis_id=str(analysis.id),
        status=analysis.status,
        file_key=analysis.file_key,
        paper_id=paper_id,
    )
