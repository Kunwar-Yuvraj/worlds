import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class OutlineBase(BaseModel):
    chapter_number: int
    title: str
    synopsis: str
    key_events: List[Any] = []
    target_word_count: int = 2000


class OutlineCreate(OutlineBase):
    pass


class OutlineUpdate(BaseModel):
    chapter_number: Optional[int] = None
    title: Optional[str] = None
    synopsis: Optional[str] = None
    key_events: Optional[List[Any]] = None
    target_word_count: Optional[int] = None


class OutlineRead(OutlineBase):
    id: uuid.UUID
    novel_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
