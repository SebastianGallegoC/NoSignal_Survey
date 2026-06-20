import logging
from time import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_current_user
from app.core.database import get_session
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserMe, UserRole
from app.services.auth import authenticate_user

router = APIRouter()
logger = logging.getLogger(__name__)
FAILED_ATTEMPTS: dict[str, list[float]] = {}
MAX_FAILED_ATTEMPTS = 5
WINDOW_SECONDS = 300


def _prune_attempts(username: str) -> None:
    now = time()
    FAILED_ATTEMPTS[username] = [t for t in FAILED_ATTEMPTS.get(username, []) if now - t <= WINDOW_SECONDS]
    if not FAILED_ATTEMPTS[username]:
        FAILED_ATTEMPTS.pop(username, None)


def _is_rate_limited(username: str) -> bool:
    _prune_attempts(username)
    return len(FAILED_ATTEMPTS.get(username, [])) >= MAX_FAILED_ATTEMPTS


def _register_failure(username: str) -> None:
    attempts = FAILED_ATTEMPTS.setdefault(username, [])
    attempts.append(time())
    _prune_attempts(username)


def _clear_failures(username: str) -> None:
    FAILED_ATTEMPTS.pop(username, None)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    if _is_rate_limited(payload.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="too_many_attempts",
        )
    user = await authenticate_user(session, payload.username, payload.password)
    if user is None:
        _register_failure(payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_credentials",
        )
    _clear_failures(payload.username)
    token, expires_in = create_access_token(
        user.username,
        role=UserRole(user.role),
        user_id=int(user.id),
    )
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        username=user.username,
        role=UserRole(user.role),
    )


@router.get("/me", response_model=UserMe)
async def me(current_user: CurrentUser = Depends(get_current_user)) -> UserMe:
    return UserMe(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
    )
