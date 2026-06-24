from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.form_stats import (
    MES_ETIQUETAS,
    aggregate_cumple_informacion_vivienda,
    aggregate_monthly_diligencias,
    aggregate_resultado_validacion_count,
    aggregate_validation_stats,
    list_distinct_anios_fecha_visita,
    list_distinct_municipios,
)
from app.schemas.form_stats import (
    FormStatsAniosResponse,
    FormStatsCumpleDetalle,
    FormStatsFiltersApplied,
    FormStatsMonthlyMunicipioSerie,
    FormStatsMonthlyResponse,
    FormStatsMunicipiosResponse,
    FormStatsResponse,
)
from app.constants.form_validation import RESULTADO_CUMPLE, RESULTADO_NO_CUMPLE


async def get_validation_stats(
    session: AsyncSession,
    *,
    municipio: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    resultado_validacion: str | None = None,
) -> FormStatsResponse:
    filtros = FormStatsFiltersApplied(
        municipio=municipio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        resultado_validacion=resultado_validacion,
    )

    if resultado_validacion == RESULTADO_CUMPLE:
        (
            sin_servicio_energia,
            servicio_irregular_directo,
            servicio_irregular_indirecto,
            sin_clasificar,
        ) = await aggregate_cumple_informacion_vivienda(
            session,
            municipio=municipio,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )
        detalle = FormStatsCumpleDetalle(
            sin_servicio_energia=sin_servicio_energia,
            servicio_irregular_directo=servicio_irregular_directo,
            servicio_irregular_indirecto=servicio_irregular_indirecto,
            sin_clasificar=sin_clasificar,
        )
        total = (
            sin_servicio_energia
            + servicio_irregular_directo
            + servicio_irregular_indirecto
            + sin_clasificar
        )
        return FormStatsResponse(
            total=total,
            cumple=total,
            no_cumple=0,
            sin_resultado=0,
            vista="cumple_detalle",
            cumple_detalle=detalle,
            filtros_aplicados=filtros,
        )

    if resultado_validacion == RESULTADO_NO_CUMPLE:
        no_cumple = await aggregate_resultado_validacion_count(
            session,
            resultado_validacion=RESULTADO_NO_CUMPLE,
            municipio=municipio,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )
        return FormStatsResponse(
            total=no_cumple,
            cumple=0,
            no_cumple=no_cumple,
            sin_resultado=0,
            vista="no_cumple",
            cumple_detalle=None,
            filtros_aplicados=filtros,
        )

    cumple, no_cumple, sin_resultado = await aggregate_validation_stats(
        session,
        municipio=municipio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    total = cumple + no_cumple + sin_resultado
    return FormStatsResponse(
        total=total,
        cumple=cumple,
        no_cumple=no_cumple,
        sin_resultado=sin_resultado,
        vista="resumen",
        cumple_detalle=None,
        filtros_aplicados=filtros,
    )


async def get_distinct_municipios(session: AsyncSession) -> FormStatsMunicipiosResponse:
    municipios = await list_distinct_municipios(session)
    return FormStatsMunicipiosResponse(municipios=municipios)


async def get_distinct_anios(session: AsyncSession) -> FormStatsAniosResponse:
    anios = await list_distinct_anios_fecha_visita(session)
    return FormStatsAniosResponse(anios=anios)


async def get_monthly_diligencias(
    session: AsyncSession,
    *,
    anio: int,
    municipios: list[str],
) -> FormStatsMonthlyResponse:
    rows = await aggregate_monthly_diligencias(
        session,
        anio=anio,
        municipios=municipios,
    )
    by_municipio: dict[str, list[int]] = {m: [0] * 12 for m in municipios}
    for municipio, mes, total in rows:
        if municipio in by_municipio:
            by_municipio[municipio][mes - 1] = total

    series = [
        FormStatsMonthlyMunicipioSerie(municipio=m, totales=by_municipio[m])
        for m in municipios
    ]
    total = sum(sum(s.totales) for s in series)
    return FormStatsMonthlyResponse(
        anio=anio,
        municipios=municipios,
        etiquetas_mes=list(MES_ETIQUETAS),
        series=series,
        total=total,
    )
