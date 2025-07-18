from datetime import datetime, UTC

from beanie import Document
from pydantic import Field


class Paper(Document):
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "papers"
