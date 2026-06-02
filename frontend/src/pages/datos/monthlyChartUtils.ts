import type { FormStatsMonthlyResponse } from "@/services/api";

/** Etiqueta de la única serie cuando se agrupan todos los municipios. */
export const TODOS_MUNICIPIOS_CHART_LABEL = "Todos los municipios";

const SERIE_COLORS = [
  "#0d9488",
  "#6366f1",
  "#f59e0b",
  "#e11d48",
  "#8b5cf6",
  "#0891b2",
  "#84cc16",
  "#db2777",
] as const;

export function serieColor(index: number): string {
  return SERIE_COLORS[index % SERIE_COLORS.length];
}

export type MonthlyChartRow = {
  mes: string;
  mesIndex: number;
  [municipio: string]: string | number;
};

/** Suma todas las series en una sola barra por mes. */
export function aggregateMonthlyStatsTodos(
  data: FormStatsMonthlyResponse,
): FormStatsMonthlyResponse {
  const totales = Array.from({ length: 12 }, (_, monthIndex) =>
    data.series.reduce((sum, serie) => sum + (serie.totales[monthIndex] ?? 0), 0),
  );
  return {
    ...data,
    municipios: [TODOS_MUNICIPIOS_CHART_LABEL],
    series: [{ municipio: TODOS_MUNICIPIOS_CHART_LABEL, totales }],
    total: totales.reduce((acc, n) => acc + n, 0),
  };
}

export function buildMonthlyChartRows(
  data: FormStatsMonthlyResponse,
): MonthlyChartRow[] {
  return data.etiquetas_mes.map((mes, index) => {
    const row: MonthlyChartRow = { mes, mesIndex: index + 1 };
    for (const serie of data.series) {
      row[serie.municipio] = serie.totales[index] ?? 0;
    }
    return row;
  });
}
