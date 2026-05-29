import type { FormFieldKey } from "@/types/formFields";

/** Campos numéricos WGS84 (grados decimales y altitud) en formulario e importación Excel. */
export const COORD_NUMERIC_FIELD_KEYS = new Set<FormFieldKey>([
  "latitud",
  "longitud",
  "metros_sobre_nivel_mar",
]);

export const COORD_LAT_LON_FIELD_KEYS = new Set<FormFieldKey>([
  "latitud",
  "longitud",
]);

export const COORD_DECIMAL_COMMA_MSG =
  "Usá el punto (.) como separador decimal. No se permite la coma (,).";

export function coordDecimalInputHasComma(raw: string): boolean {
  return raw.includes(",");
}

/**
 * Entrada manual en formulario: solo dígitos, un «-» inicial y punto (.).
 * Las comas se eliminan al tipear (no se convierten).
 */
export function sanitizeCoordManualInput(raw: string): string {
  const noComma = raw.replace(/,/g, "");
  let out = "";
  let hasDot = false;
  for (let i = 0; i < noComma.length; i++) {
    const ch = noComma[i];
    if (ch === "-") {
      if (out.length === 0) {
        out += ch;
      }
      continue;
    }
    if (ch === ".") {
      if (!hasDot) {
        out += ch;
        hasDot = true;
      }
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      out += ch;
    }
  }
  return out;
}

export function validateCoordLatLonField(
  raw: string,
  field: "latitud" | "longitud",
): string | true {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return true;
  }
  if (coordDecimalInputHasComma(raw)) {
    return COORD_DECIMAL_COMMA_MSG;
  }
  const norm = normalizeCoordNumericCell(raw);
  if (norm === "" || !Number.isFinite(Number(norm))) {
    return field === "latitud"
      ? "LATITUD debe ser un número decimal con punto (.) como separador."
      : "LONGITUD debe ser un número decimal con punto (.) como separador.";
  }
  const n = Number(norm);
  if (field === "latitud" && (n < -90 || n > 90)) {
    return "LATITUD debe estar entre -90 y 90.";
  }
  if (field === "longitud" && (n < -180 || n > 180)) {
    return "LONGITUD debe estar entre -180 y 180.";
  }
  return true;
}

/** Decimales al capturar ubicación con GPS (modo automático). */
export const COORD_DECIMAL_PLACES = 6;

export function roundCoordDecimal(n: number): number {
  if (!Number.isFinite(n)) {
    return n;
  }
  const factor = 10 ** COORD_DECIMAL_PLACES;
  return Math.round(n * factor) / factor;
}

/** Formato fijo de 6 decimales para coordenadas obtenidas por GPS. */
export function formatGpsCoordDecimal(n: number): string {
  return roundCoordDecimal(n).toFixed(COORD_DECIMAL_PLACES);
}

/**
 * Normaliza entrada de coordenadas sin recortar decimales (modo manual).
 * Solo limpia símbolos, espacios y coma decimal.
 */
export function formatCoordDecimalFromCell(raw: string): string {
  return normalizeCoordNumericCell(raw);
}

export function formatCoordForDatosFormulario(
  raw: string,
  modoCoordenadas: "automatico" | "manual",
): string {
  const normalized = normalizeCoordNumericCell(raw);
  if (normalized === "") {
    return "";
  }
  if (modoCoordenadas === "manual") {
    return normalized;
  }
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? formatGpsCoordDecimal(n) : normalized;
}

/**
 * Extrae el primer número de una celda (GMS o decimal), tolerando símbolos y coma decimal.
 * Incluye LONGITUD/LATITUD con sufijo o prefijo °, guion Unicode (Excel), y NFKC (ancho completo).
 * Ej.: "73°" → "73", "  -74,1° " → "-74.1", "°4,5" → "4.5", "−74,08°" (U+2212) → "-74.08".
 */
export function normalizeCoordNumericCell(raw: string): string {
  let t = raw.trim().normalize("NFKC").replace(/\s/g, "").replace(/,/g, ".");
  t = t.replace(/\u2212/g, "-");
  if (t === "") {
    return "";
  }
  t = t.replace(/^[^0-9.-]+/, "");
  const m = t.match(/^-?\d+(?:\.\d+)?/);
  return m ? m[0] : "";
}
