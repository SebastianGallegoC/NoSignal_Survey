from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.encuestador_profile import EncuestadorProfileCreate
from app.services.encuestador_profiles import (
    create_profile_for_user,
    delete_profile_for_user,
    validate_profile_is_assignable,
)


@pytest.mark.asyncio
async def test_delete_profile_for_user_blocked_when_profile_in_use(monkeypatch):
    profile = SimpleNamespace(id=12, habilitado=True)
    monkeypatch.setattr(
        "app.services.encuestador_profiles.get_profile_for_user",
        AsyncMock(return_value=profile),
    )
    monkeypatch.setattr(
        "app.services.encuestador_profiles.count_forms_using_profile",
        AsyncMock(return_value=2),
    )

    deleted, reason = await delete_profile_for_user(AsyncMock(), "encuestador", 12)

    assert deleted is False
    assert reason == "profile_in_use"


@pytest.mark.asyncio
async def test_validate_profile_is_assignable_rejects_disabled(monkeypatch):
    profile = SimpleNamespace(id=7, habilitado=False)
    monkeypatch.setattr(
        "app.services.encuestador_profiles.get_profile_for_user",
        AsyncMock(return_value=profile),
    )

    ok, reason = await validate_profile_is_assignable(AsyncMock(), "encuestador", 7)

    assert ok is False
    assert reason == "encuestador_profile_disabled"


@pytest.mark.asyncio
async def test_create_profile_for_user_ok(monkeypatch):
    created = SimpleNamespace(
        id=1,
        username_owner="encuestador",
        nombres_apellidos_encuestador="Juan Perez",
        tipo_documento_encuestador="CÉDULA DE CIUDADANÍA",
        numero_documento_encuestador="1010",
        telefono_encuestador="3000000000",
        cargo_encuestador="Encuestador",
        empresa_entidad_encuestador="NoSignal",
        firma_encuestador="Juan Perez",
        habilitado=True,
        created_at=None,
        updated_at=None,
    )
    monkeypatch.setattr(
        "app.services.encuestador_profiles.create_profile",
        AsyncMock(return_value=created),
    )

    payload = EncuestadorProfileCreate(
        nombres_apellidos_encuestador="Juan Perez",
        tipo_documento_encuestador="CÉDULA DE CIUDADANÍA",
        numero_documento_encuestador="1010",
        telefono_encuestador="3000000000",
        cargo_encuestador="Encuestador",
        empresa_entidad_encuestador="NoSignal",
        firma_encuestador="Juan Perez",
        habilitado=True,
    )

    result = await create_profile_for_user(AsyncMock(), "encuestador", payload)

    assert result.id == 1
    assert result.username_owner == "encuestador"
    assert result.nombres_apellidos_encuestador == "Juan Perez"
