import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.outline import OutlineCreate, OutlineUpdate, OutlineRead
from app.services.outline_service import OutlineService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["Outlines"])
outline_service = OutlineService()


@router.get("/novels/{id}/outlines", response_model=List[OutlineRead])
async def list_outlines(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List outlines for a novel."""
    return await outline_service.list_outlines(db, current_user.id, id)


@router.post("/novels/{id}/outlines", response_model=OutlineRead, status_code=status.HTTP_201_CREATED)
async def create_outline(
    id: uuid.UUID,
    data: OutlineCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create an outline item for a novel."""
    return await outline_service.create_outline(db, current_user.id, id, data)


@router.get("/outlines/{id}", response_model=OutlineRead)
async def get_outline(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get outline item details."""
    return await outline_service.get_outline(db, current_user.id, id)


@router.put("/outlines/{id}", response_model=OutlineRead)
async def update_outline(
    id: uuid.UUID,
    data: OutlineUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update an outline item."""
    return await outline_service.update_outline(db, current_user.id, id, data)


@router.delete("/outlines/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outline(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete an outline item."""
    await outline_service.delete_outline(db, current_user.id, id)
