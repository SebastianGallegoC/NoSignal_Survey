import {
  COORD_NUMERIC_FIELD_KEYS,
  normalizeCoordNumericCell,
} from "@/lib/coordNumericToken";
import type { FotoForm } from "@/services/db";
import { REQUIRED_FIELDS, type FormFieldKey, type FormValues } from "@/types/formFields";

export type FormularioEditBaseline = {
  formValues: FormValues;
  fotos: FotoForm[];
  modoCoordenadas: "automatico" | "manual";
};

function normalizeFieldValue(key: FormFieldKey, raw: unknown): string {
  const trimmed = String(raw ?? "").trim();
  if (COORD_NUMERIC_FIELD_KEYS.has(key)) {
    const norm = normalizeCoordNumericCell(trimmed);
    if (norm !== "" && Number.isFinite(Number(norm))) {
      return String(Number(norm));
    }
  }
  return trimmed;
}

export function formValuesEqualForEdit(a: FormValues, b: FormValues): boolean {
  for (const key of REQUIRED_FIELDS) {
    if (normalizeFieldValue(key, a[key]) !== normalizeFieldValue(key, b[key])) {
      return false;
    }
  }
  return true;
}

export function fotosEqualForEdit(a: FotoForm[], b: FotoForm[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left.nombre_archivo !== right.nombre_archivo) {
      return false;
    }
    if (left.data !== right.data) {
      return false;
    }
    if (left.slot !== right.slot) {
      return false;
    }
  }
  return true;
}

/** True si el estado actual difiere del cargado al abrir «Editar». */
export function hasFormularioEditChanges(
  baseline: FormularioEditBaseline,
  current: FormularioEditBaseline,
): boolean {
  if (baseline.modoCoordenadas !== current.modoCoordenadas) {
    return true;
  }
  if (!formValuesEqualForEdit(baseline.formValues, current.formValues)) {
    return true;
  }
  if (!fotosEqualForEdit(baseline.fotos, current.fotos)) {
    return true;
  }
  return false;
}
