import uuid
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.database.models.user import User
from app.utils.security import decode_access_token
from app.repositories.user_repository import UserRepository

# Storyforge currently runs as a single-author local studio. Bearer credentials
# remain optional for compatibility, but the UI no longer exposes account auth.
security = HTTPBearer(auto_error=False)
user_repository = UserRepository()


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    user = None

    if credentials:
        payload = decode_access_token(credentials.credentials)
        user_id_str = payload.get("sub") if payload else None
        if user_id_str:
            try:
                user = await user_repository.get_by_id(db, uuid.UUID(user_id_str))
            except ValueError:
                user = None

    if user is None:
        user = await user_repository.get_default_active(db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No local workspace owner is configured",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )

    return user
