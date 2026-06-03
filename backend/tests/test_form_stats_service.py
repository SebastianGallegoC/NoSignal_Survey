from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.constants.form_stats_municipio import MUNICIPIO_SIN_ASOCIAR
from app.services import form_stats as stats_service


@pytest.mark.asyncio
async def test_get_distinct_municipios_includes_sentinel(monkeypatch):
    monkeypatch.setattr(
        stats_service,
        "list_distinct_municipios",
        AsyncMock(return_value=["Cúcuta", MUNICIPIO_SIN_ASOCIAR]),
    )
    response = await stats_service.get_distinct_municipios(object())
    assert response.municipios == ["Cúcuta", MUNICIPIO_SIN_ASOCIAR]


@pytest.mark.asyncio
async def test_get_monthly_diligencias_keeps_zero_series_for_sentinel(monkeypatch):
    monkeypatch.setattr(
        stats_service,
        "aggregate_monthly_diligencias",
        AsyncMock(return_value=[]),
    )

    response = await stats_service.get_monthly_diligencias(
        object(),
        anio=2026,
        municipios=[MUNICIPIO_SIN_ASOCIAR],
    )

    assert response.anio == 2026
    assert response.municipios == [MUNICIPIO_SIN_ASOCIAR]
    assert len(response.series) == 1
    assert response.series[0].municipio == MUNICIPIO_SIN_ASOCIAR
    assert response.series[0].totales == [0] * 12
    assert response.total == 0
