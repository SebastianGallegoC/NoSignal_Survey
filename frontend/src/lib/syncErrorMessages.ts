/** Mensajes claros para errores técnicos guardados en `ultimo_error` al sincronizar. */
const KNOWN_SYNC_ERRORS: Record<string, string> = {
  encuestador_profile_disabled:
    "El perfil de encuestador ya no está habilitado. Editá el formulario, elegí otro perfil y volvé a enviar.",
  encuestador_profile_not_found:
    "El perfil de encuestador ya no existe. Elegí otro perfil y volvé a enviar.",
  encuestador_profile_invalid:
    "El perfil de encuestador no es válido. Revisá la selección y volvé a enviar.",
  fecha_visita_required:
    "Falta la fecha de la visita. Editá el formulario, completala y volvé a enviar.",
  fecha_visita_invalid:
    "La fecha de la visita no es válida. Corregila y volvé a enviar.",
};

const GENERIC_REJECTED =
  "El servidor no aceptó el envío. Revisá los datos del formulario y volvé a intentar.";

const GENERIC_FAILED =
  "No se pudo subir el formulario al servidor. Revisá los datos y volvé a enviar.";

function extractErrorDetail(raw: string): string {
  const trimmed = raw.trim();
  const httpMatch = trimmed.match(/HTTP_\d+:\s*(.+)/i);
  return (httpMatch?.[1] ?? trimmed).trim();
}

/**
 * Convierte `ultimo_error` de la cola local en texto entendible para el encuestador.
 */
export function formatSyncErrorForUser(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const detail = extractErrorDetail(raw);
  for (const [code, message] of Object.entries(KNOWN_SYNC_ERRORS)) {
    if (detail.includes(code)) {
      return message;
    }
  }
  if (/^HTTP_422/i.test(raw.trim()) || /^[a-z0-9_]+$/i.test(detail)) {
    return GENERIC_REJECTED;
  }
  if (raw.length > 100 || /^HTTP_/i.test(raw)) {
    return GENERIC_FAILED;
  }
  return detail;
}
