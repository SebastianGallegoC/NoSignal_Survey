import type { FormValues } from "@/types/formFields";

export const DATOS_ENCUESTADO_OTRO = "OTRO";

export function isDatosEncuestadoOtroSelection(value: string): boolean {
  const v = value.trim().toUpperCase();
  return v === DATOS_ENCUESTADO_OTRO || v.startsWith("OTRO -");
}

export function parseDatosEncuestadoFromStorage(
  datos: string,
  otro: string,
): Pick<FormValues, "datos_encuestado" | "datos_encuestado_otro"> {
  const stored = datos.trim();
  const otroText = otro.trim();
  const match = /^OTRO\s*-\s*(.*)$/i.exec(stored);

  if (match) {
    const detail = (match[1] ?? "").trim();
    return {
      datos_encuestado: DATOS_ENCUESTADO_OTRO,
      datos_encuestado_otro: detail || otroText,
    };
  }

  if (stored.toUpperCase() === DATOS_ENCUESTADO_OTRO) {
    return {
      datos_encuestado: DATOS_ENCUESTADO_OTRO,
      datos_encuestado_otro: otroText,
    };
  }

  return {
    datos_encuestado: stored,
    datos_encuestado_otro: "",
  };
}

export function formatDatosEncuestadoForStorage(
  datos: string,
  otro: string,
): Pick<FormValues, "datos_encuestado" | "datos_encuestado_otro"> {
  const select = datos.trim();
  const detail = otro.trim();

  if (isDatosEncuestadoOtroSelection(select)) {
    if (detail) {
      return {
        datos_encuestado: `${DATOS_ENCUESTADO_OTRO} - ${detail}`,
        datos_encuestado_otro: "",
      };
    }
    return {
      datos_encuestado: DATOS_ENCUESTADO_OTRO,
      datos_encuestado_otro: "",
    };
  }

  return {
    datos_encuestado: select,
    datos_encuestado_otro: "",
  };
}

export function applyDatosEncuestadoToFormValues(values: FormValues): FormValues {
  const parsed = parseDatosEncuestadoFromStorage(
    values.datos_encuestado,
    values.datos_encuestado_otro,
  );
  return { ...values, ...parsed };
}

export function displayDatosEncuestadoValue(
  datos: unknown,
  otro: unknown,
): string {
  const stored = datos == null ? "" : String(datos).trim();
  const otroText = otro == null ? "" : String(otro).trim();
  if (!stored && !otroText) {
    return "";
  }
  const parsed = parseDatosEncuestadoFromStorage(stored, otroText);
  if (isDatosEncuestadoOtroSelection(parsed.datos_encuestado)) {
    if (parsed.datos_encuestado_otro) {
      return `${DATOS_ENCUESTADO_OTRO} - ${parsed.datos_encuestado_otro}`;
    }
    return DATOS_ENCUESTADO_OTRO;
  }
  return stored;
}
