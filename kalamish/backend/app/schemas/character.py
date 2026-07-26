import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class CharacterBase(BaseModel):
    name: str
    role: str = "supporting"
    description: Optional[str] = None
    personality_traits: Dict[str, Any] = {}
    backstory: Optional[str] = None


class CharacterCreate(CharacterBase):
    pass


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    personality_traits: Optional[Dict[str, Any]] = None
    backstory: Optional[str] = None


class CharacterRead(CharacterBase):
    id: uuid.UUID
    novel_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
