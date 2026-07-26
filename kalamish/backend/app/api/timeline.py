import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.timeline import TimelineCreate, TimelineUpdate, TimelineRead
from app.services.timeline_service import TimelineService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["Timeline"])
timeline_service = TimelineService()


@router.get("/novels/{id}/timeline", response_model=List[TimelineRead])
async def list_timeline_events(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List timeline events for a novel."""
    return await timeline_service.list_events(db, current_user.id, id)


@router.post("/novels/{id}/timeline", response_model=TimelineRead, status_code=status.HTTP_201_CREATED)
async def create_timeline_event(
    id: uuid.UUID,
    data: TimelineCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a timeline event for a novel."""
    return await timeline_service.create_event(db, current_user.id, id, data)


@router.get("/timeline/{id}", response_model=TimelineRead)
async def get_timeline_event(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get timeline event details."""
    return await timeline_service.get_event(db, current_user.id, id)


@router.put("/timeline/{id}", response_model=TimelineRead)
async def update_timeline_event(
    id: uuid.UUID,
    data: TimelineUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a timeline event."""
    return await timeline_service.update_event(db, current_user.id, id, data)


@router.delete("/timeline/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline_event(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a timeline event."""
    await timeline_service.delete_event(db, current_user.id, id)
