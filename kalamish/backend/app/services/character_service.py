import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.character_repository import CharacterRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.character import CharacterCreate, CharacterUpdate
from app.database.models.character import Character


class CharacterService:
    def __init__(
        self,
        character_repo: Optional[CharacterRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.character_repo = character_repo or CharacterRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_character(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: CharacterCreate) -> Character:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.character_repo.create(session, novel_id, data)

    async def get_character(self, session: AsyncSession, user_id: uuid.UUID, character_id: uuid.UUID) -> Character:
        character = await self.character_repo.get_by_id(session, character_id)
        if not character:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
        await self._verify_novel_owner(session, user_id, character.novel_id)
        return character

    async def list_characters(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[Character]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.character_repo.list_by_novel(session, novel_id)

    async def update_character(self, session: AsyncSession, user_id: uuid.UUID, character_id: uuid.UUID, data: CharacterUpdate) -> Character:
        character = await self.get_character(session, user_id, character_id)
        return await self.character_repo.update(session, character, data)

    async def delete_character(self, session: AsyncSession, user_id: uuid.UUID, character_id: uuid.UUID) -> None:
        character = await self.get_character(session, user_id, character_id)
        await self.character_repo.delete(session, character)
