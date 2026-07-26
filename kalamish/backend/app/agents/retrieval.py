import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.context_package import ContextPackage
from app.services.retrieval_service import RetrievalService
from app.utils.logging import logger


class RetrievalAgent:
    """Builds and returns ContextPackage using repositories/services."""

    def __init__(self, retrieval_service: Optional[RetrievalService] = None):
        self.retrieval_service = retrieval_service or RetrievalService()

    async def execute_async(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        user_instruction: str = "",
        chapter_id: Optional[uuid.UUID] = None
    ) -> ContextPackage:
        logger.info(f"[RetrievalAgent] Fetching context package via RetrievalService for novel_id={novel_id}")
        return await self.retrieval_service.build_context_package(
            session=session,
            novel_id=novel_id,
            user_instruction=user_instruction,
            chapter_id=chapter_id
        )

    def execute(self, user_instruction: str, context: Dict[str, Any]) -> ContextPackage:
        """Fallback synchronous method for dict context initialization."""
        logger.info("[RetrievalAgent] Assembling Context Package from memory dict")
        return ContextPackage(
            novel=context.get("novel", {}),
            chapter=context.get("chapter", {}),
            outline=context.get("outline", {}),
            characters=context.get("characters", []),
            relationships=context.get("relationships", []),
            timeline=context.get("timeline", []),
            world_rules=context.get("world_rules", []),
            locations=context.get("locations", []),
            plot_threads=context.get("plot_threads", []),
            relevant_scenes=context.get("relevant_scenes", []),
            user_instruction=user_instruction
        )
