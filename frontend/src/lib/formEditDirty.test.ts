import { describe, expect, it } from "vitest";

import {
  fotosEqualForEdit,
  formValuesEqualForEdit,
  hasFormularioEditChanges,
  type FormularioEditBaseline,
} from "@/lib/formEditDirty";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

function emptyValues(): FormValues {
  return Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;
}

function baseline(overrides: Partial<FormularioEditBaseline> = {}): FormularioEditBaseline {
  return {
    formValues: emptyValues(),
    fotos: [],
    modoCoordenadas: "automatico",
    ...overrides,
  };
}

describe("hasFormularioEditChanges", () => {
  it("detecta cambio en un campo de texto", () => {
    const base = baseline();
    const current = baseline({
      formValues: { ...emptyValues(), nombres_apellidos_encuestado: "Ana" },
    });
    expect(hasFormularioEditChanges(base, current)).toBe(true);
  });

  it("detecta cambio en fotos", () => {
    const base = baseline();
    const current = baseline({
      fotos: [
        {
          nombre_archivo: "a.jpg",
          data: "data:image/jpeg;base64,AA==",
          slot: 1,
        },
      ],
    });
    expect(hasFormularioEditChanges(base, current)).toBe(true);
  });

  it("devuelve false si no hubo cambios", () => {
    const base = baseline({
      formValues: { ...emptyValues(), municipio: "Cúcuta" },
      fotos: [
        {
          nombre_archivo: "a.jpg",
          data: "data:1",
          slot: 2,
        },
      ],
      modoCoordenadas: "manual",
    });
    expect(hasFormularioEditChanges(base, { ...base })).toBe(false);
  });

  it("detecta cambio de modo de coordenadas", () => {
    const base = baseline({ modoCoordenadas: "automatico" });
    const current = baseline({ modoCoordenadas: "manual" });
    expect(hasFormularioEditChanges(base, current)).toBe(true);
  });

  it("detecta quitar una foto", () => {
    const foto = {
      nombre_archivo: "a.jpg",
      data: "data:1",
      slot: 1 as const,
    };
    const base = baseline({ fotos: [foto] });
    const current = baseline({ fotos: [] });
    expect(hasFormularioEditChanges(base, current)).toBe(true);
  });

  it("trata coordenadas equivalentes como sin cambio (4.6 vs 4.600000)", () => {
    const base = baseline({
      formValues: {
        ...emptyValues(),
        latitud: "4.600000",
        longitud: "-74.080000",
      },
    });
    const current = baseline({
      formValues: {
        ...emptyValues(),
        latitud: "4.6",
        longitud: "-74.08",
      },
    });
    expect(hasFormularioEditChanges(base, current)).toBe(false);
  });
});

describe("formValuesEqualForEdit", () => {
  it("ignora espacios al comparar", () => {
    const a = { ...emptyValues(), telefono_encuestado: " 300 " };
    const b = { ...emptyValues(), telefono_encuestado: "300" };
    expect(formValuesEqualForEdit(a, b)).toBe(true);
  });

  it("normaliza metros_sobre_nivel_mar numéricamente", () => {
    const a = { ...emptyValues(), metros_sobre_nivel_mar: "2600.00" };
    const b = { ...emptyValues(), metros_sobre_nivel_mar: "2600" };
    expect(formValuesEqualForEdit(a, b)).toBe(true);
  });

  it("detecta cambio real en un selector", () => {
    const a = { ...emptyValues(), datos_encuestado: "PROPIETARIO" };
    const b = { ...emptyValues(), datos_encuestado: "ARRENDADO" };
    expect(formValuesEqualForEdit(a, b)).toBe(false);
  });
});

describe("fotosEqualForEdit", () => {
  it("distingue slot", () => {
    const foto = {
      nombre_archivo: "a.jpg",
      data: "data:1",
      slot: 1 as const,
    };
    expect(
      fotosEqualForEdit([foto], [{ ...foto, slot: 4 }]),
    ).toBe(false);
  });

  it("distingue distinto nombre de archivo", () => {
    const a = {
      nombre_archivo: "a.jpg",
      data: "data:1",
      slot: 1 as const,
    };
    const b = { ...a, nombre_archivo: "b.jpg" };
    expect(fotosEqualForEdit([a], [b])).toBe(false);
  });

  it("es sensible al orden de la lista", () => {
    const f1 = {
      nombre_archivo: "1.jpg",
      data: "data:1",
      slot: 1 as const,
    };
    const f2 = {
      nombre_archivo: "2.jpg",
      data: "data:2",
      slot: 2 as const,
    };
    expect(fotosEqualForEdit([f1, f2], [f2, f1])).toBe(false);
  });
});
