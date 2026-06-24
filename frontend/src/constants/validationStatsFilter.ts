export type FormStatsVista = "resumen" | "cumple_detalle" | "no_cumple";

export type ResultadoValidacionFilter = "" | "CUMPLE" | "NO CUMPLE";

export const RESULTADO_VALIDACION_FILTER_OPTIONS: Array<{
  value: ResultadoValidacionFilter;
  label: string;
}> = [
  { value: "", label: "Todos" },
  { value: "CUMPLE", label: "Cumplen" },
  { value: "NO CUMPLE", label: "No cumplen" },
];

export const CUMPLE_DETALLE_LABELS = {
  sin_servicio_energia: "Sin servicio de energía",
  servicio_irregular_directo: "Con servicio irregular directo",
  servicio_irregular_indirecto: "Con servicio irregular indirecto",
  sin_clasificar: "Sin clasificar",
} as const;

export type CumpleDetalleKey = keyof typeof CUMPLE_DETALLE_LABELS;

/** Paleta alineada con el verde del logo PERCENS. */
export const CUMPLE_DETALLE_THEME: Record<
  CumpleDetalleKey,
  { chart: string; bg: string; border: string; text: string }
> = {
  sin_servicio_energia: {
    chart: "#A4D44D",
    bg: "rgba(164, 212, 77, 0.22)",
    border: "#8BB83A",
    text: "#3F5F14",
  },
  servicio_irregular_directo: {
    chart: "#2E9E47",
    bg: "rgba(46, 158, 71, 0.18)",
    border: "#2E9E47",
    text: "#14532D",
  },
  servicio_irregular_indirecto: {
    chart: "#1B7C3E",
    bg: "rgba(27, 124, 62, 0.16)",
    border: "#1B7C3E",
    text: "#14532D",
  },
  sin_clasificar: {
    chart: "#7A9E82",
    bg: "rgba(122, 158, 130, 0.18)",
    border: "#94A89A",
    text: "#3F4F45",
  },
};

export const CUMPLE_DETALLE_COLORS: Record<CumpleDetalleKey, string> = {
  sin_servicio_energia: CUMPLE_DETALLE_THEME.sin_servicio_energia.chart,
  servicio_irregular_directo: CUMPLE_DETALLE_THEME.servicio_irregular_directo.chart,
  servicio_irregular_indirecto: CUMPLE_DETALLE_THEME.servicio_irregular_indirecto.chart,
  sin_clasificar: CUMPLE_DETALLE_THEME.sin_clasificar.chart,
};

export const CUMPLE_DETALLE_TOTAL_CARD_CLASS =
  "border-slate-300 bg-slate-100 text-slate-800";
