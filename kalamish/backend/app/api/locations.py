import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.location import LocationCreate, LocationUpdate, LocationRead
from app.services.location_service import LocationService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["Locations"])
location_service = LocationService()


@router.get("/novels/{id}/locations", response_model=List[LocationRead])
async def list_locations(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List locations for a novel."""
    return await location_service.list_locations(db, current_user.id, id)


@router.post("/novels/{id}/locations", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(
    id: uuid.UUID,
    data: LocationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a location for a novel."""
    return await location_service.create_location(db, current_user.id, id, data)


@router.get("/locations/{id}", response_model=LocationRead)
async def get_location(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get location details."""
    return await location_service.get_location(db, current_user.id, id)


@router.put("/locations/{id}", response_model=LocationRead)
async def update_location(
    id: uuid.UUID,
    data: LocationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a location."""
    return await location_service.update_location(db, current_user.id, id, data)


@router.delete("/locations/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a location."""
    await location_service.delete_location(db, current_user.id, id)
