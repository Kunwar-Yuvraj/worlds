from typing import TypedDict, Dict, Any, List, Optional


class NovelWorkflowState(TypedDict, total=False):
    user_instruction: str
    request_type: str
    novel_id: str
    chapter_id: Optional[str]
    db_session: Any
    raw_context: Dict[str, Any]
    context_package: Dict[str, Any]
    plan: Dict[str, Any]
    world_builder_results: Dict[str, Any]
    draft_content: str
    consistency_results: Dict[str, Any]
    edited_content: str
    memory_results: Dict[str, Any]
    logs: List[str]
