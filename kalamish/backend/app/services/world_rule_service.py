import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.world_rule_repository import WorldRuleRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.world_rule import WorldRuleCreate, WorldRuleUpdate
from app.database.models.world_rule import WorldRule


class WorldRuleService:
    def __init__(
        self,
        rule_repo: Optional[WorldRuleRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.rule_repo = rule_repo or WorldRuleRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_rule(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: WorldRuleCreate) -> WorldRule:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.rule_repo.create(session, novel_id, data)

    async def get_rule(self, session: AsyncSession, user_id: uuid.UUID, rule_id: uuid.UUID) -> WorldRule:
        rule = await self.rule_repo.get_by_id(session, rule_id)
        if not rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="World rule not found")
        await self._verify_novel_owner(session, user_id, rule.novel_id)
        return rule

    async def list_rules(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[WorldRule]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.rule_repo.list_by_novel(session, novel_id)

    async def update_rule(self, session: AsyncSession, user_id: uuid.UUID, rule_id: uuid.UUID, data: WorldRuleUpdate) -> WorldRule:
        rule = await self.get_rule(session, user_id, rule_id)
        return await self.rule_repo.update(session, rule, data)

    async def delete_rule(self, session: AsyncSession, user_id: uuid.UUID, rule_id: uuid.UUID) -> None:
        rule = await self.get_rule(session, user_id, rule_id)
        await self.rule_repo.delete(session, rule)
