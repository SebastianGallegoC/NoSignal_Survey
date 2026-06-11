import { describe, expect, it } from "vitest";

import {
  countMissingFormFields,
  countMissingFormFieldsFromSnapshot,
} from "@/lib/formCompleteness";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

const emptyValues = (): FormValues =>
  Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;

describe("formCompleteness", () => {
  it("cuenta todos los campos vacíos en un formulario nuevo", () => {
    expect(countMissingFormFields(emptyValues())).toBe(REQUIRED_FIELDS.length - 2);
  });

  it("no exige cuenta_con_cocina_otro si no eligió OTRO", () => {
    const values = emptyValues();
    values.cuenta_con_cocina = "SI";
    const missing = countMissingFormFields(values);
    expect(missing).toBeLessThan(REQUIRED_FIELDS.length - 2);
  });

  it("exige texto si datos_encuestado es OTRO", () => {
    const values = emptyValues();
    values.datos_encuestado = "OTRO";
    values.nombres_apellidos_encuestado = "Ana";
    values.fecha_visita = "2026-05-01";
    const withOtro = countMissingFormFields(values);
    values.datos_encuestado_otro = "Familiar";
    const completeOtro = countMissingFormFields(values);
    expect(completeOtro).toBeLessThan(withOtro);
  });

  it("cuenta desde snapshot con datos parciales", () => {
    const missing = countMissingFormFieldsFromSnapshot({
      datos_formulario: {
        nombres_apellidos_encuestado: "Ana Pérez",
        fecha_visita: "2026-05-01",
        municipio: "Cúcuta",
      },
      gps: { latitud: 7.5, longitud: -72.25, precision: 4 },
    });
    expect(missing).toBeGreaterThan(0);
    expect(missing).toBeLessThan(REQUIRED_FIELDS.length);
  });
});
