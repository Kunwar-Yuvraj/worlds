import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.chapter_repository import ChapterRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.chapter import ChapterCreate, ChapterUpdate
from app.database.models.chapter import Chapter


class ChapterService:
    def __init__(
        self,
        chapter_repo: Optional[ChapterRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.chapter_repo = chapter_repo or ChapterRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_chapter(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: ChapterCreate) -> Chapter:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.chapter_repo.create(session, novel_id, data)

    async def get_chapter(self, session: AsyncSession, user_id: uuid.UUID, chapter_id: uuid.UUID) -> Chapter:
        chapter = await self.chapter_repo.get_by_id(session, chapter_id)
        if not chapter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
        await self._verify_novel_owner(session, user_id, chapter.novel_id)
        return chapter

    async def list_chapters(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[Chapter]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.chapter_repo.list_by_novel(session, novel_id)

    async def update_chapter(self, session: AsyncSession, user_id: uuid.UUID, chapter_id: uuid.UUID, data: ChapterUpdate) -> Chapter:
        chapter = await self.get_chapter(session, user_id, chapter_id)
        return await self.chapter_repo.update(session, chapter, data)

    async def delete_chapter(self, session: AsyncSession, user_id: uuid.UUID, chapter_id: uuid.UUID) -> None:
        chapter = await self.get_chapter(session, user_id, chapter_id)
        await self.chapter_repo.delete(session, chapter)
