import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.agent_memory import AgentMemory


class AgentMemoryRepository:
    async def create(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        agent_name: str,
        memory_key: str,
        memory_value: Dict[str, Any]
    ) -> AgentMemory:
        memory = AgentMemory(
            novel_id=novel_id,
            agent_name=agent_name,
            memory_key=memory_key,
            memory_value=memory_value
        )
        session.add(memory)
        await session.commit()
        await session.refresh(memory)
        return memory

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[AgentMemory]:
        stmt = select(AgentMemory).where(AgentMemory.novel_id == novel_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_key(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        agent_name: str,
        memory_key: str
    ) -> Optional[AgentMemory]:
        stmt = select(AgentMemory).where(
            AgentMemory.novel_id == novel_id,
            AgentMemory.agent_name == agent_name,
            AgentMemory.memory_key == memory_key
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
