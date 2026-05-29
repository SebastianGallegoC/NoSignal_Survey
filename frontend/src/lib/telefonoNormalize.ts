/** Valor guardado cuando la persona no tiene teléfono. */
export const TELEFONO_NO_TIENE_VALUE = "No tiene";

function foldLetters(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** True si el texto equivale a «no tiene (teléfono)» con distinta capitalización / tildes. */
export function isTelefonoNoTienePhrase(raw: string): boolean {
  const k = foldLetters(raw.trim());
  if (k === "") {
    return false;
  }
  return (
    k === "notiene" ||
    k === "sintelefono" ||
    k === "sinnumero" ||
    k === "notienetelefono" ||
    k === "notienenumero"
  );
}

/**
 * Convierte variantes de «no tiene» al valor canónico; si no coincide, devuelve el texto recortado.
 */
export function normalizeTelefonoStoredValue(raw: string): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  if (isTelefonoNoTienePhrase(t)) {
    return TELEFONO_NO_TIENE_VALUE;
  }
  return t;
}
