from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, require_roles
from app.core.database import get_session
from app.schemas.user import UserCreate, UserListResponse, UserRead, UserRole, UserUpdate
from app.services.users import create_user_account, list_user_reads, update_user_account

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def list_users_endpoint(
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(require_roles(UserRole.ADMIN)),
) -> UserListResponse:
    items = await list_user_reads(session)
    return UserListResponse(items=items)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(require_roles(UserRole.ADMIN)),
) -> UserRead:
    try:
        return await create_user_account(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.patch("/{user_id}", response_model=UserRead)
async def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(require_roles(UserRole.ADMIN)),
) -> UserRead:
    try:
        updated = await update_user_account(session, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user_not_found")
    return updated
