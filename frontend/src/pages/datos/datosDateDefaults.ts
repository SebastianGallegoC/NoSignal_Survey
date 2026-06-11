import { toIsoDateStringLocal } from "@/lib/isoDateLocal";

/** Rango ISO (YYYY-MM-DD) del mes calendario actual en hora local. */
export function getCurrentMonthIsoDateRange(): { desde: string; hasta: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    desde: toIsoDateStringLocal(first),
    hasta: toIsoDateStringLocal(last),
  };
}

export function getCurrentCalendarYear(): number {
  return new Date().getFullYear();
}

/** Año por defecto del gráfico mensual: año actual si hay datos; si no, el más reciente disponible. */
export function getDefaultMonthlyAnio(anioOptions: number[]): number {
  const currentYear = getCurrentCalendarYear();
  if (anioOptions.includes(currentYear)) {
    return currentYear;
  }
  return anioOptions[0] ?? currentYear;
}
