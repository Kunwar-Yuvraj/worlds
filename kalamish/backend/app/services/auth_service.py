import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.schemas.auth import UserLogin, Token
from app.database.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token


class AuthService:
    def __init__(self, user_repo: Optional[UserRepository] = None):
        self.user_repo = user_repo or UserRepository()

    async def register(self, session: AsyncSession, user_create: UserCreate) -> User:
        existing_user = await self.user_repo.get_by_email(session, user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        hashed_pwd = hash_password(user_create.password)
        new_user = await self.user_repo.create(session, user_create, hashed_pwd)
        return new_user

    async def login(self, session: AsyncSession, login_data: UserLogin) -> Token:
        user = await self.user_repo.get_by_email(session, login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        token_data = {
            "sub": str(user.id),
            "email": user.email
        }
        token_str = create_access_token(data=token_data)
        return Token(access_token=token_str, token_type="bearer")

    async def get_user_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        return await self.user_repo.get_by_id(session, user_id)
