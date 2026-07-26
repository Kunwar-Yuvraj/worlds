import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ChapterBase(BaseModel):
    chapter_number: int
    title: str
    content: Optional[str] = ""
    summary: Optional[str] = None
    status: str = "draft"


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    chapter_number: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None


class ChapterRead(ChapterBase):
    id: uuid.UUID
    novel_id: uuid.UUID
    word_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
