from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.user import UserCreate, UserRole, UserUpdate
from app.services.users import create_user_account, delete_user_account, update_user_account


@pytest.mark.asyncio
async def test_create_user_account_rejects_admin_role():
    with pytest.raises(ValueError, match="admin_role_creation_forbidden"):
        await create_user_account(
            AsyncMock(),
            UserCreate(username="nuevo", password="12345678", role=UserRole.ADMIN),
        )


@pytest.mark.asyncio
async def test_update_user_account_rejects_admin_user(monkeypatch):
    admin_user = SimpleNamespace(
        id=1,
        username="admin",
        role=UserRole.ADMIN.value,
        is_active=True,
        password_hash="hash",
    )
    monkeypatch.setattr(
        "app.services.users.get_user_by_id",
        AsyncMock(return_value=admin_user),
    )

    with pytest.raises(ValueError, match="admin_user_immutable"):
        await update_user_account(
            AsyncMock(),
            1,
            UserUpdate(is_active=False),
        )


@pytest.mark.asyncio
async def test_update_user_account_rejects_promotion_to_admin(monkeypatch):
    editor_user = SimpleNamespace(
        id=2,
        username="editor",
        role=UserRole.EDITOR.value,
        is_active=True,
        password_hash="hash",
    )
    monkeypatch.setattr(
        "app.services.users.get_user_by_id",
        AsyncMock(return_value=editor_user),
    )

    with pytest.raises(ValueError, match="admin_role_creation_forbidden"):
        await update_user_account(
            AsyncMock(),
            2,
            UserUpdate(role=UserRole.ADMIN),
        )


@pytest.mark.asyncio
async def test_delete_user_account_rejects_admin_user(monkeypatch):
    admin_user = SimpleNamespace(
        id=1,
        username="admin",
        role=UserRole.ADMIN.value,
        is_active=True,
        password_hash="hash",
    )
    monkeypatch.setattr(
        "app.services.users.get_user_by_id",
        AsyncMock(return_value=admin_user),
    )

    with pytest.raises(ValueError, match="admin_user_immutable"):
        await delete_user_account(AsyncMock(), 1)


@pytest.mark.asyncio
async def test_delete_user_account_deletes_non_admin(monkeypatch):
    editor_user = SimpleNamespace(
        id=2,
        username="editor",
        role=UserRole.EDITOR.value,
        is_active=True,
        password_hash="hash",
    )
    delete_mock = AsyncMock()
    monkeypatch.setattr(
        "app.services.users.get_user_by_id",
        AsyncMock(return_value=editor_user),
    )
    monkeypatch.setattr("app.services.users.delete_user", delete_mock)

    deleted = await delete_user_account(AsyncMock(), 2)

    assert deleted is True
    delete_mock.assert_awaited_once()
    assert delete_mock.await_args.args[1] is editor_user
