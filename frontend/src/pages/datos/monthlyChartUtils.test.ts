import { describe, expect, it } from "vitest";

import {
  aggregateMonthlyStatsTodos,
  buildMonthlyChartRows,
  TODOS_MUNICIPIOS_CHART_LABEL,
} from "@/pages/datos/monthlyChartUtils";
import type { FormStatsMonthlyResponse } from "@/services/api";

const sampleMonthly = (): FormStatsMonthlyResponse => ({
  anio: 2026,
  municipios: ["Cúcuta"],
  etiquetas_mes: [
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
  ],
  series: [
    {
      municipio: "Cúcuta",
      totales: [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    },
  ],
  total: 6,
});

describe("aggregateMonthlyStatsTodos", () => {
  it("suma todas las series en una sola por mes", () => {
    const raw = sampleMonthly();
    raw.series.push({
      municipio: "Medellín",
      totales: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    raw.total = 9;
    const agg = aggregateMonthlyStatsTodos(raw);
    expect(agg.series).toHaveLength(1);
    expect(agg.series[0]?.municipio).toBe(TODOS_MUNICIPIOS_CHART_LABEL);
    expect(agg.series[0]?.totales[0]).toBe(4);
    expect(agg.total).toBe(9);
  });
});

describe("buildMonthlyChartRows", () => {
  it("genera 12 filas con claves por municipio", () => {
    const rows = buildMonthlyChartRows(sampleMonthly());
    expect(rows).toHaveLength(12);
    expect(rows[0]).toMatchObject({ mes: "Ene", mesIndex: 1, Cúcuta: 1 });
    expect(rows[11]).toMatchObject({ mes: "Dic", mesIndex: 12, Cúcuta: 3 });
  });
});
