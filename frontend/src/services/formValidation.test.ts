import { describe, expect, it } from "vitest";

import type { RegistroFotoSlot } from "@/config/registroFotografico";
import type { FotoForm, OfflineForm } from "@/services/db";
import {
  validateFormValues,
  validateFormValuesWithFieldDetails,
  validateOfflineFormPayload,
} from "@/services/formValidation";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

const emptyValues = (): FormValues =>
  Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;

const registroFotosCompletas = (): FotoForm[] =>
  ([1, 2, 3, 4, 5, 6] as RegistroFotoSlot[]).map((slot) => ({
    nombre_archivo: `foto_${slot}.jpg`,
    data: "data:image/jpeg;base64,AA==",
    slot,
  }));

const baseForm = (datos: Record<string, unknown>): OfflineForm => ({
  id_formulario: "x",
  id_perfil_encuestador: 1,
  fecha_hora: new Date().toISOString(),
  gps: { latitud: 4.6, longitud: -74.08, precision: 4 },
  datos_formulario: datos,
  fotos: registroFotosCompletas(),
  estado_sincronizacion: "PENDIENTE",
});

describe("formValidation — envío mínimo Survey", () => {
  it("validateFormValues no marca obligatorios en formulario vacío", () => {
    const issues = validateFormValues(emptyValues());
    expect(issues.filter((i) => i.code.startsWith("field_"))).toHaveLength(0);
  });

  it("validateOfflineFormPayload exige nombre del encuestado", () => {
    const form = baseForm(emptyValues());
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("encuestado_required");
  });

  it("validateOfflineFormPayload acepta encuestado, GPS y 6 fotos", () => {
    const datos = emptyValues();
    datos.nombres_apellidos_encuestado = "Ana Pérez";
    const issues = validateOfflineFormPayload(baseForm(datos));
    expect(issues).toHaveLength(0);
  });

  it("validateOfflineFormPayload exige los 6 slots del registro fotográfico", () => {
    const datos = emptyValues();
    datos.nombres_apellidos_encuestado = "Ana Pérez";
    const form = {
      ...baseForm(datos),
      fotos: [{ nombre_archivo: "a.jpg", data: "data:image/jpeg;base64,AA==", slot: 1 as const }],
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("fotos_count");
    expect(issues.map((i) => i.code)).toContain("fotos_slot_required");
  });

  it("validateOfflineFormPayload rechaza fecha_actualizacion anterior a fecha_hora", () => {
    const datos = emptyValues();
    datos.nombres_apellidos_encuestado = "Ana Pérez";
    const form = {
      ...baseForm(datos),
      fecha_hora: "2026-05-10T12:00:00.000Z",
      fecha_actualizacion: "2026-05-01T12:00:00.000Z",
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("fecha_actualizacion_before_envio");
  });
});

describe("formValidation — campos Survey", () => {
  it("rechaza coma en latitud y longitud", () => {
    const values = emptyValues();
    values.latitud = "4,60971";
    values.longitud = "-74,08";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(fieldIssues.some((i) => i.field === "latitud")).toBe(true);
    expect(fieldIssues.some((i) => i.field === "longitud")).toBe(true);
  });

  it("acepta coordenadas con punto decimal", () => {
    const values = emptyValues();
    values.latitud = "4.60971";
    values.longitud = "-74.08175";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(
      fieldIssues.filter(
        (i) => i.field === "latitud" || i.field === "longitud",
      ),
    ).toHaveLength(0);
  });

  it("valida edad del encuestado en rango", () => {
    const values = emptyValues();
    values.edad_encuestado = "121";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(fieldIssues.map((i) => i.code)).toContain("edad_range");
  });

  it("valida fecha de visita", () => {
    const values = emptyValues();
    values.fecha_visita = "no-es-fecha";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(fieldIssues.map((i) => i.code)).toContain("fecha_invalid");
  });
});
