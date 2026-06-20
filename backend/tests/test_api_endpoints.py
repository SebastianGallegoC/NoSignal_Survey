from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.api.deps import CurrentUser, get_current_user
from app.core.database import get_session
from app.main import app
from app.schemas.form_payload import MAX_GPS_ACCURACY_METERS
from app.schemas.user import UserRole


def _six_photos_payload():
    return [
        {
            "nombre_archivo": f"f{i}.jpg",
            "data": "data:image/jpeg;base64,AA==",
            "slot": i,
        }
        for i in [1, 2, 3, 4, 5, 6]
    ]


class _DummyResult:
    def first(self):
        return (1,)


class _DummyConn:
    async def execute(self, _statement):
        return _DummyResult()


class _DummyConnectCtx:
    async def __aenter__(self):
        return _DummyConn()

    async def __aexit__(self, exc_type, exc, tb):
        return False


async def _fake_session():
    yield object()


def _make_user(role: UserRole = UserRole.ADMIN, username: str = "tester") -> CurrentUser:
    return CurrentUser(id=1, username=username, role=role, is_active=True)


async def _fake_user():
    return _make_user()


def test_login_ok_and_invalid_credentials(monkeypatch):
    from app.api.v1 import auth as auth_mod

    app.dependency_overrides[get_session] = _fake_session
    monkeypatch.setattr(
        auth_mod,
        "authenticate_user",
        AsyncMock(
            side_effect=[
                SimpleNamespace(id=1, username="demo", role="admin", is_active=True),
                None,
            ]
        ),
    )
    client = TestClient(app)
    ok = client.post("/api/v1/auth/login", json={"username": "demo", "password": "demo"})
    assert ok.status_code == 200
    body = ok.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["username"] == "demo"
    assert body["role"] == "admin"

    bad = client.post("/api/v1/auth/login", json={"username": "demo", "password": "wrong"})
    assert bad.status_code == 401
    assert bad.json()["detail"] == "invalid_credentials"
    app.dependency_overrides.clear()


def test_health_returns_ok(monkeypatch):
    from app import main as main_mod

    class _DummyEngine:
        @staticmethod
        def connect():
            return _DummyConnectCtx()

    monkeypatch.setattr(main_mod, "engine", _DummyEngine())
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"
    assert body.get("schema_forms_fecha_actualizacion") is True


def test_create_form_accepts_empty_fotos_with_encuestado_name(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_persist_form(_session, payload, _user):
        return SimpleNamespace(id_formulario=payload.id_formulario)

    monkeypatch.setattr(forms_mod, "persist_form", fake_persist_form)
    client = TestClient(app)
    payload = {
        "id_formulario": "f-sin-fotos",
        "fecha_hora": "2026-05-04T12:00:00Z",
        "gps": {"latitud": 1.123, "longitud": -76.55, "precision": float(MAX_GPS_ACCURACY_METERS)},
        "datos_formulario": {"nombres_apellidos_encuestado": "Ana Pérez"},
        "fotos": [],
    }
    resp = client.post("/api/v1/forms/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"status": "queued", "id_formulario": "f-sin-fotos"}
    app.dependency_overrides.clear()


def test_create_form_returns_queued(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_persist_form(_session, payload, _user):
        return SimpleNamespace(id_formulario=payload.id_formulario)

    monkeypatch.setattr(forms_mod, "persist_form", fake_persist_form)
    client = TestClient(app)
    payload = {
        "id_formulario": "f-123",
        "id_perfil_encuestador": 1,
        "fecha_hora": "2026-05-04T12:00:00Z",
        "gps": {"latitud": 1.123, "longitud": -76.55, "precision": float(MAX_GPS_ACCURACY_METERS)},
        "datos_formulario": {
            "entidad_aportante": "X",
            "nombres_apellidos_encuestado": "Juan Pérez",
        },
        "fotos": _six_photos_payload(),
    }
    resp = client.post("/api/v1/forms/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"status": "queued", "id_formulario": "f-123"}
    app.dependency_overrides.clear()


def test_get_form_photo_returns_binary(monkeypatch, tmp_path: Path):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    image_path = tmp_path / "foto_1.jpg"
    image_path.write_bytes(b"fake-jpeg-binary")

    async def fake_get_paths(_session, _form_id):
        return ["uploads/2026/05/04/f1/foto_1.jpg"]

    monkeypatch.setattr(forms_mod, "get_form_fotos_paths_by_id", fake_get_paths)
    monkeypatch.setattr(forms_mod, "validated_photo_path", lambda _stored: image_path)
    client = TestClient(app)
    resp = client.get("/api/v1/forms/f1/fotos/0")
    assert resp.status_code == 200
    assert resp.content == b"fake-jpeg-binary"
    assert resp.headers.get("cache-control") == "private, max-age=604800"
    app.dependency_overrides.clear()


def test_delete_form_not_found(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_delete(_session, _form_id):
        return False

    monkeypatch.setattr(forms_mod, "delete_form", fake_delete)
    client = TestClient(app)
    resp = client.delete("/api/v1/forms/no-existe")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "form_not_found"
    app.dependency_overrides.clear()


def test_get_form_by_id_ok(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_get_form(_session, form_id):
        if form_id != "f-123":
            return None
        return {
            "id_formulario": "f-123",
            "id_perfil_encuestador": 1,
            "fecha_hora": "2026-05-04T12:00:00Z",
            "fecha_actualizacion": "2026-05-04T12:30:00Z",
            "latitud": 1.123,
            "longitud": -76.55,
            "precision": None,
            "datos_formulario": {"entidad_aportante": "X"},
            "fotos": [],
        }

    monkeypatch.setattr(forms_mod, "get_form_for_read_by_id", fake_get_form)
    client = TestClient(app)
    resp = client.get("/api/v1/forms/f-123")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id_formulario"] == "f-123"
    assert "id_usuario" not in body
    app.dependency_overrides.clear()


def test_search_forms_ok(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_search(_session, **kwargs):
        assert kwargs["limit"] == 20
        assert kwargs["offset"] == 40
        assert kwargs["q"] == "ana"
        assert kwargs["municipio"] == "Popayan"
        assert kwargs["fecha_desde"] == "2026-01-01"
        assert kwargs["fecha_hasta"] == "2026-01-31"
        return (
            [
                {
                    "id_formulario": "f-1",
                    "id_perfil_encuestador": 7,
                    "fecha_hora": "2026-01-10T10:00:00+00:00",
                    "fecha_actualizacion": "2026-01-10T10:10:00+00:00",
                    "latitud": 2.4,
                    "longitud": -76.6,
                    "precision": None,
                    "nombres_apellidos_encuestado": "Ana Gomez",
                    "municipio": "Popayan",
                    "fecha_visita": "2026-01-10",
                    "resultado_validacion": "CUMPLE",
                }
            ],
            77,
        )

    monkeypatch.setattr(forms_mod, "search_forms_summary", fake_search)
    client = TestClient(app)
    resp = client.get(
        "/api/v1/forms/search?limit=20&offset=40&q=ana&municipio=Popayan&fecha_desde=2026-01-01&fecha_hasta=2026-01-31"
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 77
    assert body["limit"] == 20
    assert body["offset"] == 40
    assert body["items"][0]["id_formulario"] == "f-1"
    app.dependency_overrides.clear()


def test_search_forms_unauthorized(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session

    async def _raise_401():
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="invalid_token")

    app.dependency_overrides[get_current_user] = _raise_401
    monkeypatch.setattr(forms_mod, "search_forms_summary", AsyncMock(return_value=([], 0)))
    client = TestClient(app)
    resp = client.get("/api/v1/forms/search")
    assert resp.status_code == 401
    app.dependency_overrides.clear()


def test_get_form_by_id_not_found(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_get_form(_session, _form_id):
        return None

    monkeypatch.setattr(forms_mod, "get_form_for_read_by_id", fake_get_form)
    client = TestClient(app)
    resp = client.get("/api/v1/forms/no-existe")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "form_not_found"
    app.dependency_overrides.clear()


def test_delete_form_returns_204(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user

    async def fake_delete(_session, form_id):
        return form_id == "f-del"

    monkeypatch.setattr(forms_mod, "delete_form", fake_delete)
    client = TestClient(app)
    resp = client.delete("/api/v1/forms/f-del")
    assert resp.status_code == 204
    assert resp.content == b""
    app.dependency_overrides.clear()


def test_auth_me_returns_current_user():
    app.dependency_overrides[get_current_user] = _fake_user
    try:
        client = TestClient(app)
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"
        assert resp.json()["username"] == "tester"
    finally:
        app.dependency_overrides.clear()


def test_delete_form_forbidden_for_encuestador(monkeypatch):
    from app.api.v1 import forms as forms_mod

    app.dependency_overrides[get_session] = _fake_session

    async def _encuestador():
        return _make_user(role=UserRole.ENCUESTADOR, username="encuestador")

    app.dependency_overrides[get_current_user] = _encuestador
    monkeypatch.setattr(forms_mod, "delete_form", AsyncMock(return_value=True))
    try:
        client = TestClient(app)
        resp = client.delete("/api/v1/forms/f-del")
        assert resp.status_code == 403
        assert resp.json()["detail"] == "forbidden_role"
    finally:
        app.dependency_overrides.clear()


def test_list_users_admin_ok(monkeypatch):
    from app.api.v1 import users as users_mod

    app.dependency_overrides[get_session] = _fake_session
    app.dependency_overrides[get_current_user] = _fake_user
    monkeypatch.setattr(
        users_mod,
        "list_user_reads",
        AsyncMock(
            return_value=[
                {
                    "id": 1,
                    "username": "admin",
                    "role": "admin",
                    "is_active": True,
                    "created_at": "2026-06-20T00:00:00",
                    "updated_at": "2026-06-20T00:00:00",
                }
            ]
        ),
    )
    try:
        client = TestClient(app)
        resp = client.get("/api/v1/users/")
        assert resp.status_code == 200
        assert resp.json()["items"][0]["username"] == "admin"
    finally:
        app.dependency_overrides.clear()


def test_users_forbidden_for_editor(monkeypatch):
    from app.api.v1 import users as users_mod

    app.dependency_overrides[get_session] = _fake_session

    async def _editor():
        return _make_user(role=UserRole.EDITOR, username="editor")

    app.dependency_overrides[get_current_user] = _editor
    monkeypatch.setattr(users_mod, "list_user_reads", AsyncMock(return_value=[]))
    try:
        client = TestClient(app)
        resp = client.get("/api/v1/users/")
        assert resp.status_code == 403
        assert resp.json()["detail"] == "forbidden_role"
    finally:
        app.dependency_overrides.clear()
