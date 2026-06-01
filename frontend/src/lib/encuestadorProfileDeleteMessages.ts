import { EncuestadorProfileApiError } from "@/services/api";

const PROFILE_IN_USE_CODES = new Set([
  "encuestador_profile_in_use",
  "profile_in_use",
]);

export function isEncuestadorProfileInUseError(error: unknown): boolean {
  if (!(error instanceof EncuestadorProfileApiError)) {
    return false;
  }
  if (error.status === 409) {
    return true;
  }
  const detail = error.detail.trim().toLowerCase();
  return [...PROFILE_IN_USE_CODES].some((code) => detail.includes(code));
}

export function encuestadorProfileDeleteBlockedMessage(): string {
  return (
    "No se puede eliminar este perfil porque ya está vinculado a uno o más formularios " +
    "diligenciados. Si ya no querés usarlo en registros nuevos, deshabilitá el perfil en lugar de eliminarlo."
  );
}

export function encuestadorProfileDeleteErrorMessage(error: unknown): string {
  if (isEncuestadorProfileInUseError(error)) {
    return encuestadorProfileDeleteBlockedMessage();
  }
  if (error instanceof EncuestadorProfileApiError) {
    return error.detail || "No se pudo eliminar el perfil.";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "No se pudo eliminar el perfil.";
}
