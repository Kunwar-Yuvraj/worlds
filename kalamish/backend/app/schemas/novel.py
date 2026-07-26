import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NovelBase(BaseModel):
    title: str
    genre: Optional[str] = None
    language: str = "English"
    tone: Optional[str] = None
    style: Optional[str] = None
    pov: Optional[str] = None
    estimated_chapters: int = 10


class NovelCreate(NovelBase):
    pass


class NovelUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    tone: Optional[str] = None
    style: Optional[str] = None
    pov: Optional[str] = None
    estimated_chapters: Optional[int] = None
    status: Optional[str] = None


class NovelRead(NovelBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
