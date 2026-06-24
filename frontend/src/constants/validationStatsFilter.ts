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

export const CUMPLE_DETALLE_COLORS = {
  sin_servicio_energia: "#d97706",
  servicio_irregular_directo: "#0d9488",
  servicio_irregular_indirecto: "#2563eb",
  sin_clasificar: "#94a3b8",
} as const;
