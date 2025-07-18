from datetime import datetime, UTC

from beanie import Document
from pydantic import Field


class Paper(Document):
    title: str
    doi: str
    created_at: datetime = Field(default_factory=datetime.now(UTC))

    class Settings:
        collection = "papers"
