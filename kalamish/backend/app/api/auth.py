from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.user import UserCreate, UserRead
from app.schemas.auth import UserLogin, Token, MessageResponse
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user
from app.database.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Register a new user account."""
    user = await auth_service.register(db, user_data)
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Authenticate user and return JWT access token."""
    token = await auth_service.login(db, login_data)
    return token


@router.get("/me", response_model=UserRead)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Retrieve current authenticated user profile."""
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Log out current authenticated user."""
    return MessageResponse(message="Successfully logged out")
