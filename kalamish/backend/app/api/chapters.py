import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.chapter import ChapterCreate, ChapterUpdate, ChapterRead
from app.services.chapter_service import ChapterService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["Chapters"])
chapter_service = ChapterService()


@router.get("/novels/{id}/chapters", response_model=List[ChapterRead])
async def list_chapters(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List all chapters for a given novel."""
    return await chapter_service.list_chapters(db, current_user.id, id)


@router.post("/novels/{id}/chapters", response_model=ChapterRead, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    id: uuid.UUID,
    data: ChapterCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a new chapter inside a novel."""
    return await chapter_service.create_chapter(db, current_user.id, id, data)


@router.get("/chapters/{id}", response_model=ChapterRead)
async def get_chapter(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get chapter by ID."""
    return await chapter_service.get_chapter(db, current_user.id, id)


@router.put("/chapters/{id}", response_model=ChapterRead)
async def update_chapter(
    id: uuid.UUID,
    data: ChapterUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a chapter by ID."""
    return await chapter_service.update_chapter(db, current_user.id, id, data)


@router.delete("/chapters/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a chapter by ID."""
    await chapter_service.delete_chapter(db, current_user.id, id)
