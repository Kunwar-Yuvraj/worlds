import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.character import CharacterCreate, CharacterUpdate, CharacterRead
from app.services.character_service import CharacterService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["Characters"])
character_service = CharacterService()


@router.get("/novels/{id}/characters", response_model=List[CharacterRead])
async def list_characters(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List characters for a novel."""
    return await character_service.list_characters(db, current_user.id, id)


@router.post("/novels/{id}/characters", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
async def create_character(
    id: uuid.UUID,
    data: CharacterCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a character for a novel."""
    return await character_service.create_character(db, current_user.id, id, data)


@router.get("/characters/{id}", response_model=CharacterRead)
async def get_character(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get character details."""
    return await character_service.get_character(db, current_user.id, id)


@router.put("/characters/{id}", response_model=CharacterRead)
async def update_character(
    id: uuid.UUID,
    data: CharacterUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a character."""
    return await character_service.update_character(db, current_user.id, id, data)


@router.delete("/characters/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a character."""
    await character_service.delete_character(db, current_user.id, id)
