from enum import Enum

from beanie import Document


class AnalysisStatus(Enum):
    CREATED = "created"
    EXTRACTING_TEXT = "extracting_text"
    PROCESSING_INTO_BLOCKS = "processing_into_blocks"
    COMPLETED = "completed"
    ERRORED = "errored"


class Analysis(Document):
    status: AnalysisStatus
    file_key: str
    paper_id: str

    class Settings:
        collection = "analyses"