import type { FormularioSnapshot } from "@/components/form/FormularioRespuestaReadOnly";
import {
  isRegistroFotoSlot,
  REGISTRO_FOTO_SLOT_NUMBERS,
  type RegistroFotoSlot,
} from "@/config/registroFotografico";
import { GPS_PLACEHOLDER_WHEN_NOT_CAPTURED } from "@/constants/gpsConfig";
import {
  isCuentaConCocinaOtroSelection,
  parseCuentaConCocinaFromStorage,
} from "@/lib/cuentaConCocina";
import {
  isDatosEncuestadoOtroSelection,
  parseDatosEncuestadoFromStorage,
} from "@/lib/datosEncuestado";
import { normalizeCoordNumericCell } from "@/lib/coordNumericToken";
import { REQUIRED_FIELDS, type FormFieldKey, type FormValues } from "@/types/formFields";
import { buildFormValuesFromSnapshot } from "@/services/formHistory";

function isBlank(value: string): boolean {
  return value.trim() === "";
}

function isGpsPlaceholder(
  gps: FormularioSnapshot["gps"] | null | undefined,
): boolean {
  if (!gps) {
    return true;
  }
  return (
    gps.latitud === GPS_PLACEHOLDER_WHEN_NOT_CAPTURED.latitud &&
    gps.longitud === GPS_PLACEHOLDER_WHEN_NOT_CAPTURED.longitud
  );
}

function coordFieldFilled(value: string, gpsCoord: number | undefined): boolean {
  const token = normalizeCoordNumericCell(value);
  if (token !== "" && token !== "0") {
    return true;
  }
  if (typeof gpsCoord === "number" && Number.isFinite(gpsCoord) && gpsCoord !== 0) {
    return true;
  }
  return false;
}

/** Campos auxiliares que solo cuentan si el select principal eligió OTRO. */
const CONDITIONAL_OTRO_FIELDS: Partial<
  Record<FormFieldKey, (values: FormValues) => boolean>
> = {
  cuenta_con_cocina_otro: (values) =>
    isCuentaConCocinaOtroSelection(values.cuenta_con_cocina),
  datos_encuestado_otro: (values) =>
    isDatosEncuestadoOtroSelection(values.datos_encuestado),
};

function isFieldMissing(
  key: FormFieldKey,
  values: FormValues,
  gps: FormularioSnapshot["gps"] | null | undefined,
): boolean {
  const conditional = CONDITIONAL_OTRO_FIELDS[key];
  if (conditional && !conditional(values)) {
    return false;
  }

  if (key === "latitud") {
    return !coordFieldFilled(values.latitud, gps?.latitud);
  }
  if (key === "longitud") {
    return !coordFieldFilled(values.longitud, gps?.longitud);
  }

  if (key === "cuenta_con_cocina") {
    const parsed = parseCuentaConCocinaFromStorage(
      values.cuenta_con_cocina,
      values.cuenta_con_cocina_otro,
    );
    if (isCuentaConCocinaOtroSelection(parsed.cuenta_con_cocina)) {
      return isBlank(parsed.cuenta_con_cocina_otro);
    }
    return isBlank(parsed.cuenta_con_cocina);
  }

  if (key === "datos_encuestado") {
    const parsed = parseDatosEncuestadoFromStorage(
      values.datos_encuestado,
      values.datos_encuestado_otro,
    );
    if (isDatosEncuestadoOtroSelection(parsed.datos_encuestado)) {
      return isBlank(parsed.datos_encuestado_otro);
    }
    return isBlank(parsed.datos_encuestado);
  }

  return isBlank(values[key]);
}

function resolveFotoSlot(foto: {
  slot?: unknown;
  visita?: unknown;
}): RegistroFotoSlot | null {
  if (isRegistroFotoSlot(foto.slot)) {
    return foto.slot;
  }
  if (
    foto.visita === 1 ||
    foto.visita === 2 ||
    foto.visita === 3 ||
    foto.visita === 4
  ) {
    return foto.visita as RegistroFotoSlot;
  }
  return null;
}

function fotoSlotHasContent(foto: {
  data?: string;
  path?: string;
  serverFormId?: string;
  serverIndex?: number;
}): boolean {
  if (typeof foto.data === "string" && foto.data.trim() !== "") {
    return true;
  }
  if (typeof foto.path === "string" && foto.path.trim() !== "") {
    return true;
  }
  return (
    typeof foto.serverFormId === "string" &&
    foto.serverFormId.trim() !== "" &&
    typeof foto.serverIndex === "number" &&
    Number.isFinite(foto.serverIndex)
  );
}

export function getMissingPhotoSlots(
  fotos: FormularioSnapshot["fotos"] | undefined,
): RegistroFotoSlot[] {
  const present = new Set<RegistroFotoSlot>();
  for (const foto of fotos ?? []) {
    const slot = resolveFotoSlot(foto);
    if (slot == null || !fotoSlotHasContent(foto)) {
      continue;
    }
    present.add(slot);
  }
  return REGISTRO_FOTO_SLOT_NUMBERS.filter((slot) => !present.has(slot));
}

export function countMissingPhotoSlots(
  fotos: FormularioSnapshot["fotos"] | undefined,
): number {
  return getMissingPhotoSlots(fotos).length;
}

function shouldSkipFieldInCompletenessLoop(key: FormFieldKey): boolean {
  return key === "cuenta_con_cocina_otro" || key === "datos_encuestado_otro";
}

export function countMissingFormFields(values: FormValues): number {
  let missing = 0;
  for (const key of REQUIRED_FIELDS) {
    if (shouldSkipFieldInCompletenessLoop(key)) {
      continue;
    }
    if (isFieldMissing(key, values, null)) {
      missing += 1;
    }
  }
  return missing;
}

export function getMissingFormFieldKeysFromSnapshot(
  snapshot: FormularioSnapshot,
): Set<FormFieldKey> {
  const values = buildFormValuesFromSnapshot(snapshot);
  const gps = isGpsPlaceholder(snapshot.gps) ? null : snapshot.gps;
  const missing = new Set<FormFieldKey>();
  for (const key of REQUIRED_FIELDS) {
    if (shouldSkipFieldInCompletenessLoop(key)) {
      continue;
    }
    if (isFieldMissing(key, values, gps)) {
      missing.add(key);
    }
  }
  return missing;
}

export function countMissingFormFieldsFromSnapshot(
  snapshot: FormularioSnapshot,
): number {
  return (
    getMissingFormFieldKeysFromSnapshot(snapshot).size +
    countMissingPhotoSlots(snapshot.fotos)
  );
}

export type MissingPendingSummary = {
  missingFieldCount: number;
  missingPhotoCount: number;
};

export function getMissingPendingSummary(
  snapshot: FormularioSnapshot,
): MissingPendingSummary {
  return {
    missingFieldCount: getMissingFormFieldKeysFromSnapshot(snapshot).size,
    missingPhotoCount: countMissingPhotoSlots(snapshot.fotos),
  };
}

export function formatMissingFieldsBadge(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count === 1 ? "Falta 1 campo" : `Faltan ${count} campos`;
}

export function formatMissingPhotosBadge(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count === 1 ? "Falta 1 foto" : `Faltan ${count} fotos`;
}

export function countMissingFieldsInSection(
  fieldKeys: readonly FormFieldKey[],
  missingFieldKeys: Set<FormFieldKey>,
): number {
  return fieldKeys.filter((key) => missingFieldKeys.has(key)).length;
}

/** Texto del badge en el listado de diligenciados (campos y fotos por separado). */
export function formatMissingPendingListBadge(
  summary: MissingPendingSummary,
): string | null {
  const { missingFieldCount, missingPhotoCount } = summary;
  if (missingFieldCount === 0 && missingPhotoCount === 0) {
    return null;
  }
  if (missingFieldCount > 0 && missingPhotoCount === 0) {
    return formatMissingFieldsBadge(missingFieldCount);
  }
  if (missingFieldCount === 0 && missingPhotoCount > 0) {
    return formatMissingPhotosBadge(missingPhotoCount);
  }
  const fieldsLabel =
    missingFieldCount === 1 ? "1 campo" : `${missingFieldCount} campos`;
  const photosLabel =
    missingPhotoCount === 1 ? "1 foto" : `${missingPhotoCount} fotos`;
  return `Faltan ${fieldsLabel} y ${photosLabel}`;
}
