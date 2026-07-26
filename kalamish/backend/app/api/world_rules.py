import uuid
from typing import List, Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.world_rule import WorldRuleCreate, WorldRuleUpdate, WorldRuleRead
from app.services.world_rule_service import WorldRuleService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(tags=["World Rules"])
world_rule_service = WorldRuleService()


@router.get("/novels/{id}/world-rules", response_model=List[WorldRuleRead])
async def list_world_rules(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """List world rules for a novel."""
    return await world_rule_service.list_rules(db, current_user.id, id)


@router.post("/novels/{id}/world-rules", response_model=WorldRuleRead, status_code=status.HTTP_201_CREATED)
async def create_world_rule(
    id: uuid.UUID,
    data: WorldRuleCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a world rule for a novel."""
    return await world_rule_service.create_rule(db, current_user.id, id, data)


@router.get("/world-rules/{id}", response_model=WorldRuleRead)
async def get_world_rule(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get world rule details."""
    return await world_rule_service.get_rule(db, current_user.id, id)


@router.put("/world-rules/{id}", response_model=WorldRuleRead)
async def update_world_rule(
    id: uuid.UUID,
    data: WorldRuleUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update a world rule."""
    return await world_rule_service.update_rule(db, current_user.id, id, data)


@router.delete("/world-rules/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_rule(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Delete a world rule."""
    await world_rule_service.delete_rule(db, current_user.id, id)
