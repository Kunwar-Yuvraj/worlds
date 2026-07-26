import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.outline import Outline
from app.schemas.outline import OutlineCreate, OutlineUpdate


class OutlineRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: OutlineCreate) -> Outline:
        outline = Outline(
            novel_id=novel_id,
            **data.model_dump()
        )
        session.add(outline)
        await session.commit()
        await session.refresh(outline)
        return outline

    async def get_by_id(self, session: AsyncSession, outline_id: uuid.UUID) -> Optional[Outline]:
        stmt = select(Outline).where(Outline.id == outline_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[Outline]:
        stmt = select(Outline).where(Outline.novel_id == novel_id).order_by(Outline.chapter_number.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, outline: Outline, data: OutlineUpdate) -> Outline:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(outline, key, value)
        session.add(outline)
        await session.commit()
        await session.refresh(outline)
        return outline

    async def delete(self, session: AsyncSession, outline: Outline) -> None:
        await session.delete(outline)
        await session.commit()
