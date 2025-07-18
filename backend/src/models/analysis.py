from enum import Enum
from typing import Optional

from beanie import Document, Link

from src.models.paper import Paper


class AnalysisStatus(Enum):
    CREATED = "created"
    EXTRACTING_MARKDOWN = "extracting_markdown"
    MARKDOWN_EXTRACTED = "markdown_extracted"
    GENERATING_METADATA = "generating_metadata"
    METADATA_GENERATED = "metadata_generated"
    PROCESSING_INTO_BLOCKS = "processing_into_blocks"
    BLOCKS_PROCESSED = "blocks_processed"
    GENERATING_QUIZZES = "generating_quizzes"
    COMPLETED = "completed"
    ERRORED = "errored"


class Analysis(Document):
    status: AnalysisStatus
    file_key: str
    paper: Optional[Link[Paper]] = None
    processed_markdown: Optional[str] = None
    error_message: Optional[str] = None

    class Settings:
        name = "analyses"