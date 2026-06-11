import { describe, expect, it } from "vitest";

import {
  applyDatosEncuestadoToFormValues,
  displayDatosEncuestadoValue,
  formatDatosEncuestadoForStorage,
  parseDatosEncuestadoFromStorage,
} from "@/lib/datosEncuestado";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

const emptyValues = (): FormValues =>
  Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;

describe("datosEncuestado", () => {
  it("parsea OTRO - detalle desde almacenamiento", () => {
    expect(
      parseDatosEncuestadoFromStorage("OTRO - Familiar", ""),
    ).toEqual({
      datos_encuestado: "OTRO",
      datos_encuestado_otro: "Familiar",
    });
  });

  it("formatea OTRO con texto para persistencia", () => {
    expect(
      formatDatosEncuestadoForStorage("OTRO", "Familiar"),
    ).toEqual({
      datos_encuestado: "OTRO - Familiar",
      datos_encuestado_otro: "",
    });
  });

  it("display combina OTRO y detalle", () => {
    expect(displayDatosEncuestadoValue("OTRO - Familiar", "")).toBe(
      "OTRO - Familiar",
    );
    expect(displayDatosEncuestadoValue("PROPIETARIO", "")).toBe("PROPIETARIO");
  });

  it("applyDatosEncuestadoToFormValues separa valor almacenado", () => {
    const values = emptyValues();
    values.datos_encuestado = "OTRO - Familiar";
    values.datos_encuestado_otro = "";
    expect(applyDatosEncuestadoToFormValues(values)).toMatchObject({
      datos_encuestado: "OTRO",
      datos_encuestado_otro: "Familiar",
    });
  });
});
