import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    async def get_default_active(self, session: AsyncSession) -> Optional[User]:
        """Return the local workspace owner used by the no-auth studio."""
        stmt = (
            select(User)
            .where(User.is_active.is_(True))
            .order_by(User.created_at.asc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, session: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower())
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, user_create: UserCreate, hashed_password: str) -> User:
        db_user = User(
            email=user_create.email.lower(),
            hashed_password=hashed_password,
            full_name=user_create.full_name,
            is_active=True
        )
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
        return db_user
