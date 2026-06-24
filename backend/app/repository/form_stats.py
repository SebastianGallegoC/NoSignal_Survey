from datetime import date

from sqlalchemy import Integer, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.form_stats_municipio import MUNICIPIO_SIN_ASOCIAR
from app.constants.form_validation import (
    INFORMACION_VIVIENDA_CUMPLE_CLASIFICACION,
    INFORMACION_VIVIENDA_IRREGULAR_DIRECTO,
    INFORMACION_VIVIENDA_IRREGULAR_INDIRECTO,
    INFORMACION_VIVIENDA_SIN_SERVICIO_ENERGIA,
    RESULTADO_CUMPLE,
    RESULTADO_NO_CUMPLE,
)
from app.models.form_record import FormRecord

MES_ETIQUETAS = (
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
)


def _json_text(key: str):
    return FormRecord.datos_formulario[key].as_string()


def _municipio_vacio():
    municipio_col = _json_text("municipio")
    return or_(municipio_col.is_(None), municipio_col == "")


def _apply_common_stats_filters(
    stmt,
    *,
    municipio: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    resultado_validacion: str | None = None,
):
    municipio_col = _json_text("municipio")
    fecha_visita = _json_text("fecha_visita")

    if municipio:
        if municipio == MUNICIPIO_SIN_ASOCIAR:
            stmt = stmt.where(_municipio_vacio())
        else:
            stmt = stmt.where(municipio_col == municipio)

    if fecha_desde is not None:
        desde = fecha_desde.isoformat()
        stmt = stmt.where(
            fecha_visita.isnot(None),
            fecha_visita != "",
            fecha_visita >= desde,
        )

    if fecha_hasta is not None:
        hasta = fecha_hasta.isoformat()
        stmt = stmt.where(
            fecha_visita.isnot(None),
            fecha_visita != "",
            fecha_visita <= hasta,
        )

    if resultado_validacion:
        stmt = stmt.where(_json_text("resultado_validacion") == resultado_validacion)

    return stmt


async def aggregate_validation_stats(
    session: AsyncSession,
    *,
    municipio: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
) -> tuple[int, int, int]:
    """
    Devuelve (cumple, no_cumple, sin_resultado) según filtros opcionales.
    """
    resultado = _json_text("resultado_validacion")

    stmt = select(
        func.count().filter(resultado == RESULTADO_CUMPLE).label("cumple"),
        func.count().filter(resultado == RESULTADO_NO_CUMPLE).label("no_cumple"),
        func.count().filter(
            (resultado.is_(None))
            | (resultado == "")
            | (~resultado.in_([RESULTADO_CUMPLE, RESULTADO_NO_CUMPLE]))
        ).label("sin_resultado"),
    ).select_from(FormRecord)

    stmt = _apply_common_stats_filters(
        stmt,
        municipio=municipio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )

    result = await session.execute(stmt)
    row = result.one()
    cumple = int(row.cumple or 0)
    no_cumple = int(row.no_cumple or 0)
    sin_resultado = int(row.sin_resultado or 0)
    return cumple, no_cumple, sin_resultado


async def aggregate_cumple_informacion_vivienda(
    session: AsyncSession,
    *,
    municipio: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
) -> tuple[int, int, int, int]:
    """
    Devuelve conteos de formularios CUMPLE clasificados por informacion_vivienda.
    """
    informacion = _json_text("informacion_vivienda")
    stmt = select(
        func.count()
        .filter(informacion == INFORMACION_VIVIENDA_SIN_SERVICIO_ENERGIA)
        .label("sin_servicio_energia"),
        func.count()
        .filter(informacion == INFORMACION_VIVIENDA_IRREGULAR_DIRECTO)
        .label("servicio_irregular_directo"),
        func.count()
        .filter(informacion == INFORMACION_VIVIENDA_IRREGULAR_INDIRECTO)
        .label("servicio_irregular_indirecto"),
        func.count()
        .filter(
            informacion.is_(None)
            | (informacion == "")
            | (~informacion.in_(INFORMACION_VIVIENDA_CUMPLE_CLASIFICACION))
        )
        .label("sin_clasificar"),
    ).select_from(FormRecord)

    stmt = _apply_common_stats_filters(
        stmt,
        municipio=municipio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        resultado_validacion=RESULTADO_CUMPLE,
    )

    result = await session.execute(stmt)
    row = result.one()
    return (
        int(row.sin_servicio_energia or 0),
        int(row.servicio_irregular_directo or 0),
        int(row.servicio_irregular_indirecto or 0),
        int(row.sin_clasificar or 0),
    )


async def aggregate_resultado_validacion_count(
    session: AsyncSession,
    *,
    resultado_validacion: str,
    municipio: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
) -> int:
    stmt = select(func.count()).select_from(FormRecord)
    stmt = _apply_common_stats_filters(
        stmt,
        municipio=municipio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        resultado_validacion=resultado_validacion,
    )
    result = await session.execute(stmt)
    return int(result.scalar_one() or 0)


async def list_distinct_municipios(session: AsyncSession) -> list[str]:
    """Municipios presentes en formularios; incluye centinela para no asociado."""
    municipio_col = _json_text("municipio")
    stmt = (
        select(municipio_col)
        .select_from(FormRecord)
        .where(municipio_col.isnot(None), municipio_col != "")
        .distinct()
        .order_by(municipio_col)
    )
    result = await session.execute(stmt)
    municipios = [str(row[0]).strip() for row in result.all() if row[0] and str(row[0]).strip()]
    if await exists_forms_without_municipio(session):
        municipios.append(MUNICIPIO_SIN_ASOCIAR)
    return municipios


async def exists_forms_without_municipio(session: AsyncSession) -> bool:
    stmt = select(func.count()).select_from(FormRecord).where(_municipio_vacio())
    total = int((await session.execute(stmt)).scalar_one() or 0)
    return total > 0


def _fecha_visita_valida():
    fecha_visita = _json_text("fecha_visita")
    return (
        fecha_visita.isnot(None),
        fecha_visita != "",
        func.length(fecha_visita) >= 10,
        func.substring(fecha_visita, 5, 1) == "-",
        func.substring(fecha_visita, 8, 1) == "-",
    )


async def list_distinct_anios_fecha_visita(session: AsyncSession) -> list[int]:
    fecha_visita = _json_text("fecha_visita")
    anio_txt = func.substring(fecha_visita, 1, 4)
    stmt = (
        select(anio_txt)
        .select_from(FormRecord)
        .where(*_fecha_visita_valida())
        .distinct()
        .order_by(anio_txt.desc())
    )
    result = await session.execute(stmt)
    anios: list[int] = []
    for row in result.all():
        raw = row[0]
        if raw is None:
            continue
        try:
            anios.append(int(str(raw).strip()))
        except ValueError:
            continue
    return anios


async def aggregate_monthly_diligencias(
    session: AsyncSession,
    *,
    anio: int,
    municipios: list[str],
) -> list[tuple[str, int, int]]:
    """
    Devuelve filas (municipio, mes 1-12, total) para el año y municipios dados.
  """
    normalized = [m.strip() for m in municipios if m and m.strip()]
    include_sin_asociar = MUNICIPIO_SIN_ASOCIAR in normalized
    named_municipios = [m for m in normalized if m != MUNICIPIO_SIN_ASOCIAR]
    if not named_municipios and not include_sin_asociar:
        return []

    fecha_visita = _json_text("fecha_visita")
    municipio_col = _json_text("municipio")
    anio_txt = str(anio)
    mes_col = cast(func.substring(fecha_visita, 6, 2), Integer)

    municipio_filters = []
    if named_municipios:
        municipio_filters.append(municipio_col.in_(named_municipios))
    if include_sin_asociar:
        municipio_filters.append(_municipio_vacio())

    stmt = (
        select(
            municipio_col.label("municipio"),
            mes_col.label("mes"),
            func.count().label("total"),
        )
        .select_from(FormRecord)
        .where(
            *_fecha_visita_valida(),
            func.substring(fecha_visita, 1, 4) == anio_txt,
            or_(*municipio_filters),
            mes_col >= 1,
            mes_col <= 12,
        )
        .group_by(municipio_col, mes_col)
    )
    result = await session.execute(stmt)
    rows: list[tuple[str, int, int]] = []
    for row in result.all():
        municipio = str(row.municipio or "").strip() or MUNICIPIO_SIN_ASOCIAR
        mes = int(row.mes or 0)
        total = int(row.total or 0)
        if 1 <= mes <= 12:
            rows.append((municipio, mes, total))
    return rows
