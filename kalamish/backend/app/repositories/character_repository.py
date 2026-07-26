import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.character import Character
from app.schemas.character import CharacterCreate, CharacterUpdate


class CharacterRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: CharacterCreate) -> Character:
        character = Character(
            novel_id=novel_id,
            **data.model_dump()
        )
        session.add(character)
        await session.commit()
        await session.refresh(character)
        return character

    async def get_by_id(self, session: AsyncSession, character_id: uuid.UUID) -> Optional[Character]:
        stmt = select(Character).where(Character.id == character_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[Character]:
        stmt = select(Character).where(Character.novel_id == novel_id).order_by(Character.name.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, character: Character, data: CharacterUpdate) -> Character:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(character, key, value)
        session.add(character)
        await session.commit()
        await session.refresh(character)
        return character

    async def delete(self, session: AsyncSession, character: Character) -> None:
        await session.delete(character)
        await session.commit()
