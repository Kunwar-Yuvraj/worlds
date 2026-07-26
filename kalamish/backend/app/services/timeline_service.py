import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.timeline_repository import TimelineRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.timeline import TimelineCreate, TimelineUpdate
from app.database.models.timeline import TimelineEvent


class TimelineService:
    def __init__(
        self,
        timeline_repo: Optional[TimelineRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.timeline_repo = timeline_repo or TimelineRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_event(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: TimelineCreate) -> TimelineEvent:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.timeline_repo.create(session, novel_id, data)

    async def get_event(self, session: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID) -> TimelineEvent:
        event = await self.timeline_repo.get_by_id(session, event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline event not found")
        await self._verify_novel_owner(session, user_id, event.novel_id)
        return event

    async def list_events(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[TimelineEvent]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.timeline_repo.list_by_novel(session, novel_id)

    async def update_event(self, session: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID, data: TimelineUpdate) -> TimelineEvent:
        event = await self.get_event(session, user_id, event_id)
        return await self.timeline_repo.update(session, event, data)

    async def delete_event(self, session: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID) -> None:
        event = await self.get_event(session, user_id, event_id)
        await self.timeline_repo.delete(session, event)
