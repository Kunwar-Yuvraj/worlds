import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    novel_id: uuid.UUID
    chapter_id: Optional[uuid.UUID] = None
    user_instruction: str
    request_type: str = "GENERATE_CHAPTER"


class GenerateResponse(BaseModel):
    novel_id: uuid.UUID
    chapter_id: Optional[uuid.UUID] = None
    draft_content: str
    edited_content: str
    word_count: int
    consistency_results: Dict[str, Any] = Field(default_factory=dict)
    memory_results: Dict[str, Any] = Field(default_factory=dict)
    logs: List[str] = Field(default_factory=list)


class RewriteRequest(BaseModel):
    chapter_id: uuid.UUID
    user_instruction: str
    stream: bool = False


class ReviseStoryRequest(BaseModel):
    novel_id: uuid.UUID
    revision_instruction: str
    target_chapter_ids: List[uuid.UUID]


class ReviseStoryResponse(BaseModel):
    novel_id: uuid.UUID
    revised_chapters_count: int
    revision_details: List[Dict[str, Any]]


class SearchRequest(BaseModel):
    novel_id: uuid.UUID
    query: str
    limit: int = 5


class SearchResponse(BaseModel):
    novel_id: uuid.UUID
    query: str
    results: List[Dict[str, Any]]


class ChatRequest(BaseModel):
    novel_id: uuid.UUID
    message: str
    history: List[Dict[str, str]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    novel_id: uuid.UUID
    reply: str
