import type { FormularioSnapshot } from "@/components/form/FormularioRespuestaReadOnly";
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

export function countMissingFormFields(values: FormValues): number {
  let missing = 0;
  for (const key of REQUIRED_FIELDS) {
    if (key === "cuenta_con_cocina_otro" || key === "datos_encuestado_otro") {
      continue;
    }
    if (isFieldMissing(key, values, null)) {
      missing += 1;
    }
  }
  return missing;
}

export function countMissingFormFieldsFromSnapshot(
  snapshot: FormularioSnapshot,
): number {
  const values = buildFormValuesFromSnapshot(snapshot);
  const gps = isGpsPlaceholder(snapshot.gps) ? null : snapshot.gps;
  let missing = 0;
  for (const key of REQUIRED_FIELDS) {
    if (key === "cuenta_con_cocina_otro" || key === "datos_encuestado_otro") {
      continue;
    }
    if (isFieldMissing(key, values, gps)) {
      missing += 1;
    }
  }
  return missing;
}
