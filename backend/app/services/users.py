from __future__ import annotations

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User
from app.repository.users import (
    create_user,
    get_user_by_id,
    get_user_by_username,
    list_users,
    save_user,
)
from app.schemas.user import UserCreate, UserRead, UserRole, UserUpdate


def _iso(value: datetime | None) -> str:
    if value is None:
        return datetime.utcnow().isoformat()
    return value.isoformat()


def to_user_read(user: User) -> UserRead:
    return UserRead(
        id=int(user.id),
        username=user.username,
        role=UserRole(user.role),
        is_active=bool(user.is_active),
        created_at=_iso(user.created_at),
        updated_at=_iso(user.updated_at),
    )


async def list_user_reads(session: AsyncSession) -> list[UserRead]:
    users = await list_users(session)
    return [to_user_read(user) for user in users]


async def create_user_account(session: AsyncSession, payload: UserCreate) -> UserRead:
    if payload.role == UserRole.ADMIN:
        raise ValueError("admin_role_creation_forbidden")
    existing = await get_user_by_username(session, payload.username)
    if existing is not None:
        raise ValueError("username_already_exists")
    created = await create_user(
        session,
        User(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role=payload.role.value,
            is_active=True,
        ),
    )
    return to_user_read(created)


async def update_user_account(
    session: AsyncSession,
    user_id: int,
    payload: UserUpdate,
) -> UserRead | None:
    user = await get_user_by_id(session, user_id)
    if user is None:
        return None
    current_role = UserRole(user.role)
    if current_role == UserRole.ADMIN:
        raise ValueError("admin_user_immutable")
    current_active = bool(user.is_active)
    next_role = payload.role or current_role
    next_active = current_active if payload.is_active is None else payload.is_active

    if payload.role == UserRole.ADMIN:
        raise ValueError("admin_role_creation_forbidden")

    user.role = next_role.value
    user.is_active = next_active
    if payload.password:
        user.password_hash = hash_password(payload.password)
    saved = await save_user(session, user)
    return to_user_read(saved)
