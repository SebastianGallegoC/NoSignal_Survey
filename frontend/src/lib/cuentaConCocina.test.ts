import { describe, expect, it } from "vitest";

import {
  applyCuentaConCocinaToFormValues,
  displayCuentaConCocinaValue,
  formatCuentaConCocinaForStorage,
  isCuentaConCocinaOtroSelection,
  parseCuentaConCocinaFromStorage,
} from "@/lib/cuentaConCocina";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

const emptyValues = (): FormValues =>
  Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;

describe("cuentaConCocina", () => {
  it("detecta selección OTRO", () => {
    expect(isCuentaConCocinaOtroSelection("OTRO")).toBe(true);
    expect(isCuentaConCocinaOtroSelection("OTRO - algo")).toBe(true);
    expect(isCuentaConCocinaOtroSelection("SI")).toBe(false);
  });

  it("guarda OTRO con texto como OTRO - detalle", () => {
    expect(
      formatCuentaConCocinaForStorage("OTRO", "Cocina comunitaria"),
    ).toEqual({
      cuenta_con_cocina: "OTRO - Cocina comunitaria",
      cuenta_con_cocina_otro: "",
    });
  });

  it("limpia otro cuando la selección no es OTRO", () => {
    expect(formatCuentaConCocinaForStorage("SI", "texto residual")).toEqual({
      cuenta_con_cocina: "SI",
      cuenta_con_cocina_otro: "",
    });
  });

  it("separa valor almacenado para el formulario", () => {
    expect(
      parseCuentaConCocinaFromStorage("OTRO - Cocina comunitaria", ""),
    ).toEqual({
      cuenta_con_cocina: "OTRO",
      cuenta_con_cocina_otro: "Cocina comunitaria",
    });
  });

  it("compatibiliza valor legacy de plantilla", () => {
    expect(
      parseCuentaConCocinaFromStorage("OTRO - HABILITAR ESCRIBIR", "Leña"),
    ).toEqual({
      cuenta_con_cocina: "OTRO",
      cuenta_con_cocina_otro: "Leña",
    });
  });

  it("aplica parseo sobre FormValues completos", () => {
    const values = emptyValues();
    values.cuenta_con_cocina = "OTRO - Horno de barro";
    values.cuenta_con_cocina_otro = "";

    expect(applyCuentaConCocinaToFormValues(values)).toMatchObject({
      cuenta_con_cocina: "OTRO",
      cuenta_con_cocina_otro: "Horno de barro",
    });
  });

  it("muestra valor combinado en lectura", () => {
    expect(
      displayCuentaConCocinaValue("OTRO - Cocina comunitaria", ""),
    ).toBe("OTRO - Cocina comunitaria");
  });
});
