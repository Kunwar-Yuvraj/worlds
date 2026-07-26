import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.location_repository import LocationRepository
from app.repositories.novel_repository import NovelRepository
from app.schemas.location import LocationCreate, LocationUpdate
from app.database.models.location import Location


class LocationService:
    def __init__(
        self,
        location_repo: Optional[LocationRepository] = None,
        novel_repo: Optional[NovelRepository] = None
    ):
        self.location_repo = location_repo or LocationRepository()
        self.novel_repo = novel_repo or NovelRepository()

    async def _verify_novel_owner(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID):
        novel = await self.novel_repo.get_by_id(session, novel_id)
        if not novel or novel.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found")
        return novel

    async def create_location(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID, data: LocationCreate) -> Location:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.location_repo.create(session, novel_id, data)

    async def get_location(self, session: AsyncSession, user_id: uuid.UUID, location_id: uuid.UUID) -> Location:
        location = await self.location_repo.get_by_id(session, location_id)
        if not location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
        await self._verify_novel_owner(session, user_id, location.novel_id)
        return location

    async def list_locations(self, session: AsyncSession, user_id: uuid.UUID, novel_id: uuid.UUID) -> List[Location]:
        await self._verify_novel_owner(session, user_id, novel_id)
        return await self.location_repo.list_by_novel(session, novel_id)

    async def update_location(self, session: AsyncSession, user_id: uuid.UUID, location_id: uuid.UUID, data: LocationUpdate) -> Location:
        location = await self.get_location(session, user_id, location_id)
        return await self.location_repo.update(session, location, data)

    async def delete_location(self, session: AsyncSession, user_id: uuid.UUID, location_id: uuid.UUID) -> None:
        location = await self.get_location(session, user_id, location_id)
        await self.location_repo.delete(session, location)
