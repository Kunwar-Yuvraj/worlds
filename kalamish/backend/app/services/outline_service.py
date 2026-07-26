import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.outline_repository import OutlineRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.outline import OutlineCreate, OutlineUpdate
from app.database.models.outline import Outline


class OutlineService:
    def __init__(
        self,
        outline_repo: Optional[OutlineRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.outline_repo = outline_repo or OutlineRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_outline(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: OutlineCreate) -> Outline:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.outline_repo.create(session, novel_id, data)

    async def get_outline(self, session: AsyncSession, user_id: uuid.UUID, outline_id: uuid.UUID) -> Outline:
        outline = await self.outline_repo.get_by_id(session, outline_id)
        if not outline:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outline not found")
        await self._verify_novel_owner(session, user_id, outline.novel_id)
        return outline

    async def list_outlines(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[Outline]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.outline_repo.list_by_novel(session, novel_id)

    async def update_outline(self, session: AsyncSession, user_id: uuid.UUID, outline_id: uuid.UUID, data: OutlineUpdate) -> Outline:
        outline = await self.get_outline(session, user_id, outline_id)
        return await self.outline_repo.update(session, outline, data)

    async def delete_outline(self, session: AsyncSession, user_id: uuid.UUID, outline_id: uuid.UUID) -> None:
        outline = await self.get_outline(session, user_id, outline_id)
        await self.outline_repo.delete(session, outline)
