import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.relationship import CharacterRelationship


class CharacterRelationshipRepository:
    async def create(
        self,
        session: AsyncSession,
        novel_id: uuid.UUID,
        character_a_id: uuid.UUID,
        character_b_id: uuid.UUID,
        relationship_type: str,
        description: Optional[str] = None
    ) -> CharacterRelationship:
        rel = CharacterRelationship(
            novel_id=novel_id,
            character_a_id=character_a_id,
            character_b_id=character_b_id,
            relationship_type=relationship_type,
            description=description
        )
        session.add(rel)
        await session.commit()
        await session.refresh(rel)
        return rel

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[CharacterRelationship]:
        stmt = select(CharacterRelationship).where(CharacterRelationship.novel_id == novel_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self,
        session: AsyncSession,
        relationship: CharacterRelationship,
        relationship_type: str,
        description: Optional[str] = None
    ) -> CharacterRelationship:
        relationship.relationship_type = relationship_type
        relationship.description = description
        session.add(relationship)
        await session.commit()
        await session.refresh(relationship)
        return relationship

    async def reassign_characters(
        self,
        session: AsyncSession,
        relationship: CharacterRelationship,
        character_a_id: uuid.UUID,
        character_b_id: uuid.UUID
    ) -> CharacterRelationship:
        relationship.character_a_id = character_a_id
        relationship.character_b_id = character_b_id
        session.add(relationship)
        await session.commit()
        await session.refresh(relationship)
        return relationship

    async def delete(self, session: AsyncSession, rel: CharacterRelationship) -> None:
        await session.delete(rel)
        await session.commit()
