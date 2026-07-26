import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.timeline import TimelineEvent
from app.schemas.timeline import TimelineCreate, TimelineUpdate


class TimelineRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: TimelineCreate) -> TimelineEvent:
        event = TimelineEvent(
            novel_id=novel_id,
            **data.model_dump()
        )
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event

    async def get_by_id(self, session: AsyncSession, event_id: uuid.UUID) -> Optional[TimelineEvent]:
        stmt = select(TimelineEvent).where(TimelineEvent.id == event_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[TimelineEvent]:
        stmt = select(TimelineEvent).where(TimelineEvent.novel_id == novel_id).order_by(TimelineEvent.event_order.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, event: TimelineEvent, data: TimelineUpdate) -> TimelineEvent:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(event, key, value)
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event

    async def delete(self, session: AsyncSession, event: TimelineEvent) -> None:
        await session.delete(event)
        await session.commit()
