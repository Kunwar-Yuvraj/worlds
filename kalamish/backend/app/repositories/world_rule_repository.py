import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.world_rule import WorldRule
from app.schemas.world_rule import WorldRuleCreate, WorldRuleUpdate


class WorldRuleRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: WorldRuleCreate) -> WorldRule:
        rule = WorldRule(
            novel_id=novel_id,
            **data.model_dump()
        )
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return rule

    async def get_by_id(self, session: AsyncSession, rule_id: uuid.UUID) -> Optional[WorldRule]:
        stmt = select(WorldRule).where(WorldRule.id == rule_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[WorldRule]:
        stmt = select(WorldRule).where(WorldRule.novel_id == novel_id).order_by(WorldRule.rule_name.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, rule: WorldRule, data: WorldRuleUpdate) -> WorldRule:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(rule, key, value)
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return rule

    async def delete(self, session: AsyncSession, rule: WorldRule) -> None:
        await session.delete(rule)
        await session.commit()
