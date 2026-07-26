import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.chapter import Chapter
from app.schemas.chapter import ChapterCreate, ChapterUpdate


class ChapterRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: ChapterCreate) -> Chapter:
        word_cnt = len((data.content or "").split()) if data.content else 0
        chapter = Chapter(
            novel_id=novel_id,
            word_count=word_cnt,
            **data.model_dump()
        )
        session.add(chapter)
        await session.commit()
        await session.refresh(chapter)
        return chapter

    async def get_by_id(self, session: AsyncSession, chapter_id: uuid.UUID) -> Optional[Chapter]:
        stmt = select(Chapter).where(Chapter.id == chapter_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[Chapter]:
        stmt = select(Chapter).where(Chapter.novel_id == novel_id).order_by(Chapter.chapter_number.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, chapter: Chapter, data: ChapterUpdate) -> Chapter:
        update_data = data.model_dump(exclude_unset=True)
        if "content" in update_data and update_data["content"] is not None:
            update_data["word_count"] = len(update_data["content"].split())
        for key, value in update_data.items():
            setattr(chapter, key, value)
        session.add(chapter)
        await session.commit()
        await session.refresh(chapter)
        return chapter

    async def delete(self, session: AsyncSession, chapter: Chapter) -> None:
        await session.delete(chapter)
        await session.commit()
