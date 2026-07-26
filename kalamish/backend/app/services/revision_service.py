import uuid
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.revision_repository import RevisionRepository
from app.services.embedding_service import EmbeddingService
from app.services.memory_service import MemoryService
from app.schemas.chapter import ChapterUpdate
from app.utils.logging import logger


class RevisionService:
    def __init__(
        self,
        chapter_repo: Optional[ChapterRepository] = None,
        revision_repo: Optional[RevisionRepository] = None,
        embedding_service: Optional[EmbeddingService] = None,
        memory_service: Optional[MemoryService] = None
    ):
        self.chapter_repo = chapter_repo or ChapterRepository()
        self.revision_repo = revision_repo or RevisionRepository()
        self.embedding_service = embedding_service or EmbeddingService()
        self.memory_service = memory_service or MemoryService()

    async def revise_chapter(
        self,
        session: AsyncSession,
        chapter_id: uuid.UUID,
        new_content: str,
        changes_description: str,
        revised_by_agent: str = "RevisionAgent",
        reconcile_story_context: bool = False
    ) -> Dict[str, Any]:
        logger.info(f"[RevisionService] Executing chapter revision for chapter_id={chapter_id}")
        chapter = await self.chapter_repo.get_by_id(session, chapter_id)
        if not chapter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

        # 1. Fetch latest version number and increment
        latest_ver = await self.revision_repo.get_latest_version_number(session, chapter_id)
        new_ver = latest_ver + 1

        # 2. Record Revision History
        revision_record = await self.revision_repo.create(
            session=session,
            chapter_id=chapter_id,
            version_number=new_ver,
            previous_content=chapter.content,
            changes_description=changes_description,
            revised_by_agent=revised_by_agent
        )

        # 3. Update Chapter text and word count
        updated_chapter = await self.chapter_repo.update(
            session=session,
            chapter=chapter,
            data=ChapterUpdate(content=new_content)
        )

        # 4. Reconcile all story context affected by the revised chapter.
        # MemoryService also refreshes the chapter embedding and summary.
        context_updates: Dict[str, Any] = {}
        if reconcile_story_context:
            try:
                context_updates = await self.memory_service.process_and_store_memory(
                    session=session,
                    novel_id=chapter.novel_id,
                    agent_name="RevisionMemoryAgent",
                    content=new_content,
                    chapter_id=chapter_id,
                    reconcile_existing=True,
                    revision_instruction=changes_description
                )
            except Exception as exc:
                logger.exception(
                    "[RevisionService] Chapter saved, but story context reconciliation failed "
                    f"for chapter_id={chapter_id}: {exc}"
                )
                context_updates = {
                    "status": "reconciliation_failed",
                    "error": str(exc),
                    "changes": {"created": 0, "updated": 0, "deleted": 0}
                }
        else:
            await self.embedding_service.store_entity_embedding(
                session=session,
                novel_id=chapter.novel_id,
                entity_type="chapter",
                entity_id=chapter_id,
                content=new_content
            )

        return {
            "revision_id": str(revision_record.id),
            "version_number": new_ver,
            "chapter_id": str(updated_chapter.id),
            "word_count": updated_chapter.word_count,
            "changes_description": changes_description,
            "context_updates": context_updates,
            "status": "revision_completed"
        }

    async def list_chapter_revisions(self, session: AsyncSession, chapter_id: uuid.UUID) -> List[Dict[str, Any]]:
        revisions = await self.revision_repo.list_by_chapter(session, chapter_id)
        return [
            {
                "id": str(r.id),
                "version_number": r.version_number,
                "changes_description": r.changes_description,
                "revised_by_agent": r.revised_by_agent,
                "created_at": r.created_at
            }
            for r in revisions
        ]
