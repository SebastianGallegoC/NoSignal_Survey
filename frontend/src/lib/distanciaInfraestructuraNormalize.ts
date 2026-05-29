/**
 * Normaliza valores de distancia (metros) desde Excel o texto libre:
 * quita sufijo de metro `m` o `M` (con o sin espacio; `i` incluye mayúsculas)
 * y variantes típicas de Excel (p. ej. M de ancho completo vía NFKC).
 * Devuelve el primer número con coma/punto decimal.
 * Ej.: "40 m" → "40", "12,5M" → "12.5", "40Ｍ" (fullwidth) → "40".
 */
export function normalizeDistanciaInfraestructuraMetersCell(raw: string): string {
  let t = raw.trim().normalize("NFKC").replace(/\s+/g, " ");
  t = t.replace(/,/g, ".");
  t = t.replace(/\s*m\s*$/i, "").trim();
  const m = t.match(/^-?\d+(?:\.\d+)?/);
  return m ? m[0] : "";
}
