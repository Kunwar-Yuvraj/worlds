import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.revision_service import RevisionService
from app.utils.logging import logger


class RevisionAgent:
    """Story-wide modifications and multi-chapter rewrites."""

    def __init__(self, revision_service: Optional[RevisionService] = None):
        self.revision_service = revision_service or RevisionService()

    async def execute_async(
        self,
        session: AsyncSession,
        chapter_id: uuid.UUID,
        new_content: str,
        changes_description: str,
        revised_by_agent: str = "RevisionAgent"
    ) -> Dict[str, Any]:
        logger.info(f"[RevisionAgent] Executing chapter revision via RevisionService for chapter_id={chapter_id}")
        return await self.revision_service.revise_chapter(
            session=session,
            chapter_id=chapter_id,
            new_content=new_content,
            changes_description=changes_description,
            revised_by_agent=revised_by_agent
        )

    def execute(self, revision_instruction: str, target_chapters: List[str]) -> Dict[str, Any]:
        """Fallback synchronous method for dict context initialization."""
        logger.info(f"[RevisionAgent] Planning story revision across {len(target_chapters)} chapters")
        return {
            "revision_instruction": revision_instruction,
            "target_chapters": target_chapters,
            "status": "revision_planned"
        }
