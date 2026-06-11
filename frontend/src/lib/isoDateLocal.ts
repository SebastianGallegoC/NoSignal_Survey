/** Fecha calendario local en formato ISO `YYYY-MM-DD` (para `<input type="date">`). */
export function toIsoDateStringLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hoy en hora local del dispositivo. */
export function getTodayIsoDateLocal(): string {
  return toIsoDateStringLocal(new Date());
}
