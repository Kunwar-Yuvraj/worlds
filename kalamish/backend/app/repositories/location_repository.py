import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate


class LocationRepository:
    async def create(self, session: AsyncSession, novel_id: uuid.UUID, data: LocationCreate) -> Location:
        location = Location(
            novel_id=novel_id,
            **data.model_dump()
        )
        session.add(location)
        await session.commit()
        await session.refresh(location)
        return location

    async def get_by_id(self, session: AsyncSession, location_id: uuid.UUID) -> Optional[Location]:
        stmt = select(Location).where(Location.id == location_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_novel(self, session: AsyncSession, novel_id: uuid.UUID) -> List[Location]:
        stmt = select(Location).where(Location.novel_id == novel_id).order_by(Location.name.asc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, session: AsyncSession, location: Location, data: LocationUpdate) -> Location:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(location, key, value)
        session.add(location)
        await session.commit()
        await session.refresh(location)
        return location

    async def delete(self, session: AsyncSession, location: Location) -> None:
        await session.delete(location)
        await session.commit()
