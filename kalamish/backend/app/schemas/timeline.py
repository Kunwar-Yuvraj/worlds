import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TimelineBase(BaseModel):
    event_order: int
    title: str
    description: str
    chapter_id: Optional[uuid.UUID] = None
    impact: Optional[str] = None


class TimelineCreate(TimelineBase):
    pass


class TimelineUpdate(BaseModel):
    event_order: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    chapter_id: Optional[uuid.UUID] = None
    impact: Optional[str] = None


class TimelineRead(TimelineBase):
    id: uuid.UUID
    novel_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
