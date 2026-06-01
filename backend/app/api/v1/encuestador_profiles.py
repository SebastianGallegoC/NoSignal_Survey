from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.schemas.encuestador_profile import (
    EncuestadorProfileCreate,
    EncuestadorProfileEnabledUpdate,
    EncuestadorProfileLiteListResponse,
    EncuestadorProfileListResponse,
    EncuestadorProfileRead,
    EncuestadorProfileUpdate,
)
from app.services.encuestador_profiles import (
    create_profile_for_user,
    delete_profile_for_user,
    list_enabled_profile_lites,
    list_profile_reads,
    set_profile_enabled_for_user,
    update_profile_for_user,
)

router = APIRouter()


@router.get("/", response_model=EncuestadorProfileListResponse)
async def list_profiles(
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    items = await list_profile_reads(session, current_user)
    return EncuestadorProfileListResponse(items=items)


@router.get("/enabled", response_model=EncuestadorProfileLiteListResponse)
async def list_enabled_profiles(
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    items = await list_enabled_profile_lites(session, current_user)
    return EncuestadorProfileLiteListResponse(items=items)


@router.post("/", response_model=EncuestadorProfileRead)
async def create_profile(
    payload: EncuestadorProfileCreate,
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    return await create_profile_for_user(session, current_user, payload)


@router.put("/{profile_id}", response_model=EncuestadorProfileRead)
async def update_profile(
    profile_id: int,
    payload: EncuestadorProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    updated = await update_profile_for_user(session, current_user, profile_id, payload)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="encuestador_profile_not_found")
    return updated


@router.patch("/{profile_id}/enabled", response_model=EncuestadorProfileRead)
async def update_profile_enabled(
    profile_id: int,
    payload: EncuestadorProfileEnabledUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    updated = await set_profile_enabled_for_user(session, current_user, profile_id, payload.habilitado)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="encuestador_profile_not_found")
    return updated


@router.delete("/{profile_id}")
async def remove_profile(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: str = Depends(get_current_user),
):
    deleted, reason = await delete_profile_for_user(session, current_user, profile_id)
    if not deleted:
        if reason == "not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="encuestador_profile_not_found")
        if reason == "profile_in_use":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="encuestador_profile_in_use")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason or "encuestador_profile_delete_error")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
