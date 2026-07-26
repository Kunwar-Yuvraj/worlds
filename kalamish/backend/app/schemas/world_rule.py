import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WorldRuleBase(BaseModel):
    rule_name: str
    category: str = "general"
    description: str


class WorldRuleCreate(WorldRuleBase):
    pass


class WorldRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class WorldRuleRead(WorldRuleBase):
    id: uuid.UUID
    novel_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
