import type { EncuestadorProfileFormState } from "@/components/encuestador/EncuestadorProfileFormFields";
import type { EncuestadorProfileRead } from "@/services/api";

function normalizeProfileFormState(
  values: EncuestadorProfileFormState,
): EncuestadorProfileFormState {
  return {
    nombres_apellidos_encuestador: values.nombres_apellidos_encuestador.trim(),
    tipo_documento_encuestador: values.tipo_documento_encuestador.trim(),
    numero_documento_encuestador: values.numero_documento_encuestador.trim(),
    telefono_encuestador: values.telefono_encuestador.trim(),
    cargo_encuestador: values.cargo_encuestador.trim(),
    empresa_entidad_encuestador: values.empresa_entidad_encuestador.trim(),
    firma_encuestador: values.firma_encuestador.trim(),
    habilitado: values.habilitado,
  };
}

export function profileFormStateFromRead(
  profile: EncuestadorProfileRead,
): EncuestadorProfileFormState {
  return {
    nombres_apellidos_encuestador: profile.nombres_apellidos_encuestador,
    tipo_documento_encuestador: profile.tipo_documento_encuestador,
    numero_documento_encuestador: profile.numero_documento_encuestador,
    telefono_encuestador: profile.telefono_encuestador,
    cargo_encuestador: profile.cargo_encuestador,
    empresa_entidad_encuestador: profile.empresa_entidad_encuestador,
    firma_encuestador: profile.firma_encuestador,
    habilitado: profile.habilitado,
  };
}

export function encuestadorProfileFormStatesEqual(
  a: EncuestadorProfileFormState,
  b: EncuestadorProfileFormState,
): boolean {
  const left = normalizeProfileFormState(a);
  const right = normalizeProfileFormState(b);
  return (
    left.nombres_apellidos_encuestador === right.nombres_apellidos_encuestador &&
    left.tipo_documento_encuestador === right.tipo_documento_encuestador &&
    left.numero_documento_encuestador === right.numero_documento_encuestador &&
    left.telefono_encuestador === right.telefono_encuestador &&
    left.cargo_encuestador === right.cargo_encuestador &&
    left.empresa_entidad_encuestador === right.empresa_entidad_encuestador &&
    left.firma_encuestador === right.firma_encuestador &&
    left.habilitado === right.habilitado
  );
}

export function hasEncuestadorProfileEditChanges(
  baseline: EncuestadorProfileFormState | null,
  current: EncuestadorProfileFormState,
): boolean {
  if (baseline == null) {
    return true;
  }
  return !encuestadorProfileFormStatesEqual(baseline, current);
}
