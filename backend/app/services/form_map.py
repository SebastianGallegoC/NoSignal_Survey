from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.form_map import list_form_map_points
from app.schemas.form_map import (
    FormMapPointsFiltersApplied,
    FormMapPointsResponse,
)


async def get_form_map_points(
    session: AsyncSession,
    *,
    municipios: list[str],
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    resultado_validacion: str | None = None,
) -> FormMapPointsResponse:
    items = await list_form_map_points(
        session,
        municipios=municipios,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        resultado_validacion=resultado_validacion,
    )
    return FormMapPointsResponse(
        items=items,
        total=len(items),
        filtros_aplicados=FormMapPointsFiltersApplied(
            municipios=municipios,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            resultado_validacion=resultado_validacion,
        ),
    )
