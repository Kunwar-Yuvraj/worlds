import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.plot_thread import PlotThread


class PlotThreadRepository:
    async def create(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        name: str,
        description: str,
        status: str = "open",
        resolution: Optional[str] = None
    ) -> PlotThread:
        thread = PlotThread(
            novel_id=novel_id,
            name=name,
            description=description,
            status=status,
            resolution=resolution
        )
        session.add(thread)
        await session.commit()
        await session.refresh(thread)
        return thread

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[PlotThread]:
        stmt = select(PlotThread).where(PlotThread.novel_id == novel_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self,
        session: AsyncSession,
        thread: PlotThread,
        description: str,
        status: str,
        resolution: Optional[str] = None
    ) -> PlotThread:
        thread.description = description
        thread.status = status
        thread.resolution = resolution
        session.add(thread)
        await session.commit()
        await session.refresh(thread)
        return thread

    async def delete(self, session: AsyncSession, thread: PlotThread) -> None:
        await session.delete(thread)
        await session.commit()
