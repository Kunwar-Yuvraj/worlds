import uuid
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.revision import RevisionHistory


class RevisionRepository:
    async def create(
        self,
        session: AsyncSession,
        chapter_id: uuid.UUID,
        version_number: int,
        previous_content: str,
        changes_description: str,
        revised_by_agent: Optional[str] = "RevisionAgent"
    ) -> RevisionHistory:
        rev = RevisionHistory(
            chapter_id=chapter_id,
            version_number=version_number,
            previous_content=previous_content,
            changes_description=changes_description,
            revised_by_agent=revised_by_agent
        )
        session.add(rev)
        await session.commit()
        await session.refresh(rev)
        return rev

    async def list_by_chapter(self, session: AsyncSession, chapter_id: uuid.UUID) -> List[RevisionHistory]:
        stmt = select(RevisionHistory).where(RevisionHistory.chapter_id == chapter_id).order_by(RevisionHistory.version_number.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_version_number(self, session: AsyncSession, chapter_id: uuid.UUID) -> int:
        stmt = select(func.max(RevisionHistory.version_number)).where(RevisionHistory.chapter_id == chapter_id)
        result = await session.execute(stmt)
        max_val = result.scalar()
        return max_val if max_val is not None else 0
