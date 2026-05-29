/** Claves GMS obsoletas en `datos_formulario` (plantilla anterior). */
export const GMS_DATOS_KEYS = [
  "x_grados",
  "x_minutos",
  "x_segundos",
  "y_grados",
  "y_minutos",
  "y_segundos",
] as const;

/** Elimina claves GMS de un objeto de datos de formulario (copia superficial). */
export function stripGmsKeysFromDatos(
  datos: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!datos) {
    return {};
  }
  const out = { ...datos };
  for (const k of GMS_DATOS_KEYS) {
    delete out[k];
  }
  return out;
}
