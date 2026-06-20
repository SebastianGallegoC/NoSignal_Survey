from __future__ import annotations

from datetime import date
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.api.deps import CurrentUser, get_current_user
from app.api.v1 import forms as forms_api
from app.constants.form_stats_municipio import MUNICIPIO_SIN_ASOCIAR
from app.core.database import get_session
from app.main import app
from app.schemas.user import UserRole
from app.schemas.form_map import (
    FormMapPointItem,
    FormMapPointsFiltersApplied,
    FormMapPointsResponse,
)


async def _fake_session():
    yield object()


async def _fake_user():
    return CurrentUser(id=1, username="tester", role=UserRole.ADMIN, is_active=True)


def test_form_map_points_requires_auth():
    client = TestClient(app)
    resp = client.get("/api/v1/forms/map-points")
    assert resp.status_code == 401


def test_form_map_points_invalid_date_range():
    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        client = TestClient(app)
        resp = client.get(
            "/api/v1/forms/map-points",
            params={"fecha_desde": "2026-06-01", "fecha_hasta": "2026-01-01"},
            headers={"Authorization": "Bearer dummy"},
        )
        assert resp.status_code == 422
        assert resp.json()["detail"] == "fecha_desde_must_be_lte_fecha_hasta"
    finally:
        app.dependency_overrides.clear()


def test_form_map_points_ok(monkeypatch):
    async def _fake_get_points(_session, **kwargs):
        assert kwargs["municipios"] == ["Cucuta", MUNICIPIO_SIN_ASOCIAR]
        assert kwargs["fecha_desde"] == date(2026, 1, 1)
        assert kwargs["fecha_hasta"] == date(2026, 1, 31)
        return FormMapPointsResponse(
            items=[
                FormMapPointItem(
                    id_formulario="f-1",
                    latitud=7.8891,
                    longitud=-72.4967,
                    municipio="Cucuta",
                    fecha_visita="2026-01-20",
                    nombres_apellidos_encuestado="Ana Perez",
                    resultado_validacion="CUMPLE",
                )
            ],
            total=1,
            filtros_aplicados=FormMapPointsFiltersApplied(
                municipios=["Cucuta", MUNICIPIO_SIN_ASOCIAR],
                fecha_desde=date(2026, 1, 1),
                fecha_hasta=date(2026, 1, 31),
            ),
        )

    monkeypatch.setattr(
        forms_api,
        "get_form_map_points",
        AsyncMock(side_effect=_fake_get_points),
    )

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        client = TestClient(app)
        resp = client.get(
            "/api/v1/forms/map-points",
            params={
                "municipios": ["Cucuta", MUNICIPIO_SIN_ASOCIAR, "Cucuta", "   "],
                "fecha_desde": "2026-01-01",
                "fecha_hasta": "2026-01-31",
            },
            headers={"Authorization": "Bearer dummy"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["id_formulario"] == "f-1"
        assert body["items"][0]["municipio"] == "Cucuta"
        assert body["filtros_aplicados"]["municipios"] == ["Cucuta", MUNICIPIO_SIN_ASOCIAR]
    finally:
        app.dependency_overrides.clear()
