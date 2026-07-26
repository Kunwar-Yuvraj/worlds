import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.novel_repository import NovelRepository
from app.schemas.novel import NovelCreate, NovelUpdate
from app.database.models.novel import Novel


class NovelService:
    def __init__(self, novel_repo: Optional[NovelRepository] = None):
        self.novel_repo = novel_repo or NovelRepository()

    async def create_novel(self, session: AsyncSession, user_id: uuid.UUID, data: NovelCreate) -> Novel:
        return await self.novel_repo.create(session, user_id, data)

    async def get_novel(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> Novel:
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def list_novels(self, session: AsyncSession, user_id: uuid.UUID) -> List[Novel]:
        return await self.novel_repo.list_by_user(session, user_id)

    async def update_novel(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: NovelUpdate) -> Novel:
        novel = await self.get_novel(session, user_id, novel_id)
        return await self.novel_repo.update(session, novel, data)

    async def delete_novel(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> None:
        novel = await self.get_novel(session, user_id, novel_id)
        await self.novel_repo.delete(session, novel)
