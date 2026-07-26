import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.novel import NovelCreate, NovelUpdate, NovelRead
from app.services.novel_service import NovelService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(prefix="/novels", tags=["Novels"])
novel_service = NovelService()


@router.get("", response_model=List[NovelRead])
async def list_novels(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List all novels belonging to the authenticated user."""
    return await novel_service.list_novels(db, current_user.id)


@router.post("", response_model=NovelRead, status_code=status.HTTP_201_CREATED)
async def create_novel(
    data: NovelCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a new novel for the authenticated user."""
    return await novel_service.create_novel(db, current_user.id, data)


@router.get("/{id}", response_model=NovelRead)
async def get_novel(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get novel details by ID."""
    return await novel_service.get_novel(db, current_user.id, id)


@router.put("/{id}", response_model=NovelRead)
async def update_novel(
    id: uuid.UUID,
    data: NovelUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a novel by ID."""
    return await novel_service.update_novel(db, current_user.id, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_novel(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a novel by ID."""
    await novel_service.delete_novel(db, current_user.id, id)
