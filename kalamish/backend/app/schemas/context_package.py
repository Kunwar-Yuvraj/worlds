from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ContextPackage(BaseModel):
    novel: Dict[str, Any] = Field(default_factory=dict)
    chapter: Dict[str, Any] = Field(default_factory=dict)
    preceding_chapter: Dict[str, Any] = Field(default_factory=dict)
    previous_chapters: List[Dict[str, Any]] = Field(default_factory=list)
    outline: Dict[str, Any] = Field(default_factory=dict)
    characters: List[Dict[str, Any]] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    world_rules: List[Dict[str, Any]] = Field(default_factory=list)
    locations: List[Dict[str, Any]] = Field(default_factory=list)
    plot_threads: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_scenes: List[Dict[str, Any]] = Field(default_factory=list)
    user_instruction: str = ""
