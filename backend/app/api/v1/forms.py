import logging
from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse, Response
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_current_user, require_roles
from app.core.database import get_session
from app.core.schema_flags import forms_has_fecha_actualizacion
from app.repository.forms import (
    delete_form,
    get_form_fotos_paths_by_id,
    get_form_for_read_by_id,
    list_forms_for_read,
    search_forms_summary,
)
from app.schemas.form_payload import FormPayload
from app.schemas.form_map import FormMapPointsQueryParams, FormMapPointsResponse
from app.schemas.form_read import FormListResponse, FormReadItem, FormSearchResponse
from app.schemas.form_stats import (
    FormStatsAniosResponse,
    FormStatsMonthlyQueryParams,
    FormStatsMonthlyResponse,
    FormStatsMunicipiosResponse,
    FormStatsQueryParams,
    FormStatsResponse,
)
from app.services.form_stats import (
    get_distinct_anios,
    get_distinct_municipios,
    get_monthly_diligencias,
    get_validation_stats,
)
from app.services.form_map import get_form_map_points
from app.services.forms import persist_form
from app.services.storage import media_type_for_image, validated_photo_path
from app.schemas.user import UserRole

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=FormListResponse)
async def list_forms(
    request: Request,
    limit: int = Query(200, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Lista formularios guardados en el servidor (todos los dispositivos que sincronizaron)."""
    rid = getattr(request.state, "request_id", None)
    try:
        items = await list_forms_for_read(session, limit)
    except SQLAlchemyError:
        logger.exception(
            "list_forms DB error request_id=%s limit=%s user=%r schema_has_fecha_actualizacion=%s",
            rid,
            limit,
            current_user.username,
            forms_has_fecha_actualizacion,
        )
        raise
    except Exception:
        logger.exception(
            "list_forms unexpected error request_id=%s limit=%s user=%r schema_has_fecha_actualizacion=%s",
            rid,
            limit,
            current_user.username,
            forms_has_fecha_actualizacion,
        )
        raise
    logger.info(
        "list_forms_ok request_id=%s count=%s limit=%s user=%r",
        rid,
        len(items),
        limit,
        current_user.username,
    )
    return FormListResponse(items=items)


@router.get("/search", response_model=FormSearchResponse)
async def search_forms(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    q: str | None = Query(default=None),
    municipio: str | None = Query(default=None),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Listado paginado y filtrable para la tabla de formularios diligenciados."""
    rid = getattr(request.state, "request_id", None)
    try:
        items, total = await search_forms_summary(
            session,
            limit=limit,
            offset=offset,
            q=q,
            municipio=municipio,
            fecha_desde=fecha_desde.isoformat() if fecha_desde else None,
            fecha_hasta=fecha_hasta.isoformat() if fecha_hasta else None,
        )
    except SQLAlchemyError:
        logger.exception(
            "search_forms DB error request_id=%s limit=%s offset=%s user=%r",
            rid,
            limit,
            offset,
            current_user.username,
        )
        raise
    logger.info(
        "search_forms_ok request_id=%s count=%s total=%s limit=%s offset=%s user=%r",
        rid,
        len(items),
        total,
        limit,
        offset,
        current_user.username,
    )
    return FormSearchResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/stats/anios", response_model=FormStatsAniosResponse)
async def form_stats_anios(
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Años distintos con fecha de visita en formularios sincronizados."""
    try:
        return await get_distinct_anios(session)
    except SQLAlchemyError:
        logger.exception("form_stats_anios DB error user=%r", current_user.username)
        raise


@router.get("/stats/diligencias-mensuales", response_model=FormStatsMonthlyResponse)
async def form_stats_monthly_diligencias(
    anio: int = Query(..., ge=2000, le=2100),
    municipios: list[str] = Query(default=[]),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Conteo mensual de formularios por municipio (fecha de referencia: fecha_visita)."""
    try:
        params = FormStatsMonthlyQueryParams(anio=anio, municipios=municipios)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail="invalid_monthly_stats_query") from exc

    if not params.municipios:
        raise HTTPException(status_code=422, detail="municipios_required")

    try:
        return await get_monthly_diligencias(
            session,
            anio=params.anio,
            municipios=params.municipios,
        )
    except SQLAlchemyError:
        logger.exception("form_stats_monthly DB error user=%r", current_user.username)
        raise


@router.get("/stats/municipios", response_model=FormStatsMunicipiosResponse)
async def form_stats_municipios(
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Municipios distintos usados en formularios del servidor (para filtros de Datos)."""
    try:
        return await get_distinct_municipios(session)
    except SQLAlchemyError:
        logger.exception("form_stats_municipios DB error user=%r", current_user.username)
        raise


@router.get("/stats", response_model=FormStatsResponse)
async def form_validation_stats(
    municipio: str | None = Query(default=None),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Agregados de resultado_validacion con filtros opcionales por municipio y fecha_visita."""
    try:
        params = FormStatsQueryParams(
            municipio=municipio,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )
    except ValidationError as exc:
        detail = "invalid_stats_query"
        for err in exc.errors():
            if err.get("type") == "value_error" and "fecha_desde_must_be_lte" in str(
                err.get("msg", "")
            ):
                detail = "fecha_desde_must_be_lte_fecha_hasta"
                break
        raise HTTPException(status_code=422, detail=detail) from exc

    try:
        return await get_validation_stats(
            session,
            municipio=params.municipio,
            fecha_desde=params.fecha_desde,
            fecha_hasta=params.fecha_hasta,
        )
    except SQLAlchemyError:
        logger.exception("form_validation_stats DB error user=%r", current_user.username)
        raise


@router.get("/map-points", response_model=FormMapPointsResponse)
async def form_map_points(
    municipios: list[str] = Query(default=[]),
    fecha_desde: date | None = Query(default=None),
    fecha_hasta: date | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Puntos geográficos para visor de mapa en Datos."""
    try:
        params = FormMapPointsQueryParams(
            municipios=municipios,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )
    except ValidationError as exc:
        detail = "invalid_map_points_query"
        for err in exc.errors():
            if err.get("type") == "value_error" and "fecha_desde_must_be_lte" in str(
                err.get("msg", "")
            ):
                detail = "fecha_desde_must_be_lte_fecha_hasta"
                break
        raise HTTPException(status_code=422, detail=detail) from exc

    try:
        return await get_form_map_points(
            session,
            municipios=params.municipios,
            fecha_desde=params.fecha_desde,
            fecha_hasta=params.fecha_hasta,
        )
    except SQLAlchemyError:
        logger.exception("form_map_points DB error user=%r", current_user.username)
        raise


@router.get("/{form_id}", response_model=FormReadItem)
async def get_form_by_id_endpoint(
    form_id: str,
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(get_current_user),
):
    """Obtiene un formulario puntual por id para detalle/precarga en frontend."""
    item = await get_form_for_read_by_id(session, form_id)
    if item is None:
        raise HTTPException(status_code=404, detail="form_not_found")
    return item


@router.get("/{form_id}/fotos/{photo_index}")
async def get_form_photo(
    form_id: str,
    photo_index: int,
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(get_current_user),
):
    """Sirve un archivo de foto guardado en disco (requiere el mismo token que el resto del API)."""
    if photo_index < 0:
        raise HTTPException(status_code=404, detail="photo_not_found")
    paths = await get_form_fotos_paths_by_id(session, form_id)
    if paths is None:
        raise HTTPException(status_code=404, detail="form_not_found")
    if photo_index >= len(paths):
        raise HTTPException(status_code=404, detail="photo_not_found")
    abs_path = validated_photo_path(paths[photo_index])
    if abs_path is None:
        raise HTTPException(status_code=404, detail="file_missing")
    return FileResponse(
        abs_path,
        media_type=media_type_for_image(abs_path),
        headers={"Cache-Control": "private, max-age=604800"},
    )


@router.post("/")
async def create_form(
    payload: FormPayload,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    if idempotency_key and idempotency_key != payload.id_formulario:
        raise HTTPException(status_code=409, detail="idempotency_key_mismatch")

    try:
        record = await persist_form(session, payload, current_user.username)
    except ValueError as exc:
        # Errores tras validar el JSON (fotos, fecha_hora, etc.); no pasan por RequestValidationError.
        logger.warning("422 persist_form: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"status": "queued", "id_formulario": record.id_formulario}


@router.delete("/{form_id}")
async def delete_form_endpoint(
    form_id: str,
    session: AsyncSession = Depends(get_session),
    _current_user: CurrentUser = Depends(require_roles(UserRole.ADMIN, UserRole.EDITOR)),
):
    """Elimina un formulario del servidor (fila en BD y archivos de foto asociados)."""
    deleted = await delete_form(session, form_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="form_not_found")
    return Response(status_code=204)
