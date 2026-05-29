import type { FormValues } from "@/types/formFields";

export const CUENTA_CON_COCINA_OTRO = "OTRO";

/** Valor legacy de la plantilla Excel antes de simplificar la opción a «OTRO». */
const LEGACY_OTRO_PLACEHOLDER = "OTRO - HABILITAR ESCRIBIR";

export function isCuentaConCocinaOtroSelection(value: string): boolean {
  const v = value.trim().toUpperCase();
  return v === CUENTA_CON_COCINA_OTRO || v.startsWith("OTRO -") || v === LEGACY_OTRO_PLACEHOLDER;
}

export function parseCuentaConCocinaFromStorage(
  cuenta: string,
  otro: string,
): Pick<FormValues, "cuenta_con_cocina" | "cuenta_con_cocina_otro"> {
  const stored = cuenta.trim();
  const otroText = otro.trim();
  const match = /^OTRO\s*-\s*(.*)$/i.exec(stored);

  if (match) {
    const detail = (match[1] ?? "").trim();
    if (detail.toUpperCase() === "HABILITAR ESCRIBIR") {
      return {
        cuenta_con_cocina: CUENTA_CON_COCINA_OTRO,
        cuenta_con_cocina_otro: otroText,
      };
    }
    return {
      cuenta_con_cocina: CUENTA_CON_COCINA_OTRO,
      cuenta_con_cocina_otro: detail || otroText,
    };
  }

  if (stored.toUpperCase() === CUENTA_CON_COCINA_OTRO || stored.toUpperCase() === LEGACY_OTRO_PLACEHOLDER) {
    return {
      cuenta_con_cocina: CUENTA_CON_COCINA_OTRO,
      cuenta_con_cocina_otro: otroText,
    };
  }

  return {
    cuenta_con_cocina: stored,
    cuenta_con_cocina_otro: "",
  };
}

export function formatCuentaConCocinaForStorage(
  cuenta: string,
  otro: string,
): Pick<FormValues, "cuenta_con_cocina" | "cuenta_con_cocina_otro"> {
  const select = cuenta.trim();
  const detail = otro.trim();

  if (isCuentaConCocinaOtroSelection(select)) {
    if (detail) {
      return {
        cuenta_con_cocina: `${CUENTA_CON_COCINA_OTRO} - ${detail}`,
        cuenta_con_cocina_otro: "",
      };
    }
    return {
      cuenta_con_cocina: CUENTA_CON_COCINA_OTRO,
      cuenta_con_cocina_otro: "",
    };
  }

  return {
    cuenta_con_cocina: select,
    cuenta_con_cocina_otro: "",
  };
}

export function applyCuentaConCocinaToFormValues(values: FormValues): FormValues {
  const parsed = parseCuentaConCocinaFromStorage(
    values.cuenta_con_cocina,
    values.cuenta_con_cocina_otro,
  );
  return { ...values, ...parsed };
}

export function displayCuentaConCocinaValue(
  cuenta: unknown,
  otro: unknown,
): string {
  const stored = cuenta == null ? "" : String(cuenta).trim();
  const otroText = otro == null ? "" : String(otro).trim();
  if (!stored && !otroText) {
    return "";
  }
  const parsed = parseCuentaConCocinaFromStorage(stored, otroText);
  if (isCuentaConCocinaOtroSelection(parsed.cuenta_con_cocina)) {
    if (parsed.cuenta_con_cocina_otro) {
      return `${CUENTA_CON_COCINA_OTRO} - ${parsed.cuenta_con_cocina_otro}`;
    }
    return CUENTA_CON_COCINA_OTRO;
  }
  return stored;
}
