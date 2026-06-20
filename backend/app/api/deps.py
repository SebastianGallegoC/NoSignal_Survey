from dataclasses import dataclass
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.core.database import get_session
from app.repository.users import get_user_by_id, get_user_by_username
from app.schemas.user import UserRole

security = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class CurrentUser:
    id: int
    username: str
    role: UserRole
    is_active: bool


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing_bearer",
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        ) from None
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        )
    uid = payload.get("uid")
    user = None
    if isinstance(uid, int) and uid > 0:
        user = await get_user_by_id(session, uid)
    if user is None:
        user = await get_user_by_username(session, sub)
    if user is None or not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_token",
        )
    return CurrentUser(
        id=int(user.id),
        username=user.username,
        role=UserRole(user.role),
        is_active=bool(user.is_active),
    )


def require_roles(*roles: UserRole | str) -> Callable[[CurrentUser], CurrentUser]:
    allowed = {
        role if isinstance(role, UserRole) else UserRole(role)
        for role in roles
    }

    async def _require(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="forbidden_role",
            )
        return current_user

    return _require
