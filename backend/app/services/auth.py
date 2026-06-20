from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from app.models.user import User
from app.repository.users import get_user_by_username


async def authenticate_user(
    session: AsyncSession,
    username: str,
    password: str,
) -> User | None:
    user = await get_user_by_username(session, username.strip())
    if user is None:
        return None
    if not bool(user.is_active):
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
