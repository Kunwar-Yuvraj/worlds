import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.novel import Novel
from app.schemas.novel import NovelCreate, NovelUpdate


class NovelRepository:
    async def create(self, session: AsyncSession, user_id: uuid.UUID, data: NovelCreate) -> Novel:
        novel = Novel(
            user_id=user_id,
            **data.model_dump()
        )
        session.add(novel)
        await session.commit()
        await session.refresh(novel)
        return novel

    async def get_by_id(self, session: AsyncSession, novel_id: uuid.UUID) -> Optional[Novel]:
        stmt = select(Novel).where(Novel.id == novel_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(self, session: AsyncSession, user_id: uuid.UUID) -> List[Novel]:
        stmt = select(Novel).where(Novel.user_id == user_id).order_by(Novel.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, novel: Novel, data: NovelUpdate) -> Novel:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(novel, key, value)
        session.add(novel)
        await session.commit()
        await session.refresh(novel)
        return novel

    async def delete(self, session: AsyncSession, novel: Novel) -> None:
        await session.delete(novel)
        await session.commit()
