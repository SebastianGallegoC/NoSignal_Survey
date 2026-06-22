from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserRole


def _base_stmt() -> Select[tuple[User]]:
    return select(User).order_by(User.username.asc(), User.id.asc())


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(_base_stmt())
    return list(result.scalars().all())


async def count_users(session: AsyncSession) -> int:
    result = await session.execute(select(func.count()).select_from(User))
    return int(result.scalar_one() or 0)


async def count_active_admins(session: AsyncSession) -> int:
    result = await session.execute(
        select(func.count()).select_from(User).where(
            User.role == UserRole.ADMIN.value,
            User.is_active.is_(True),
        )
    )
    return int(result.scalar_one() or 0)


async def create_user(session: AsyncSession, user: User) -> User:
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def save_user(session: AsyncSession, user: User) -> User:
    await session.commit()
    await session.refresh(user)
    return user


async def delete_user(session: AsyncSession, user: User) -> None:
    await session.delete(user)
    await session.commit()
