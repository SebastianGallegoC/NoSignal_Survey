import { describe, expect, it } from "vitest";

import {
  hasFormularioEditChanges,
  type FormularioEditBaseline,
} from "@/lib/formEditDirty";
import { getFormSubmitButtonState } from "@/lib/formSubmitUi";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

function emptyValues(): FormValues {
  return Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;
}

function snapshot(overrides: Partial<FormularioEditBaseline> = {}): FormularioEditBaseline {
  return {
    formValues: {
      ...emptyValues(),
      nombres_apellidos_encuestado: "Juan Pérez",
      municipio: "Cúcuta",
      latitud: "4.600000",
      longitud: "-74.080000",
    },
    fotos: [
      {
        nombre_archivo: "visita1.jpg",
        data: "data:image/jpeg;base64,AA==",
        slot: 1,
      },
    ],
    modoCoordenadas: "automatico",
    ...overrides,
  };
}

/** Simula el botón de envío en FormularioPage según modo edición y cambios. */
function submitUiForEditSession(
  baseline: FormularioEditBaseline,
  current: FormularioEditBaseline,
  enviando = false,
) {
  const isEditMode = true;
  const hasEditChanges = hasFormularioEditChanges(baseline, current);
  return getFormSubmitButtonState(isEditMode, hasEditChanges, enviando);
}

describe("flujo editar formulario → Actualizar", () => {
  it("al abrir edición sin cambios: Actualizar deshabilitado con aviso", () => {
    const base = snapshot();
    const ui = submitUiForEditSession(base, { ...base });
    expect(ui).toEqual({
      label: "Actualizar",
      disabled: true,
      showNoChangesHint: true,
    });
  });

  it("tras cambiar un campo de texto: Actualizar habilitado", () => {
    const base = snapshot();
    const current = snapshot({
      formValues: {
        ...base.formValues,
        nombres_apellidos_encuestado: "María López",
      },
    });
    const ui = submitUiForEditSession(base, current);
    expect(ui.disabled).toBe(false);
    expect(ui.label).toBe("Actualizar");
    expect(ui.showNoChangesHint).toBe(false);
  });

  it("tras agregar una foto: Actualizar habilitado", () => {
    const base = snapshot({ fotos: [] });
    const current = snapshot({
      fotos: [
        {
          nombre_archivo: "nueva.jpg",
          data: "data:image/jpeg;base64,BB==",
          slot: 4,
        },
      ],
    });
    expect(submitUiForEditSession(base, current).disabled).toBe(false);
  });

  it("tras cambiar modo de coordenadas: Actualizar habilitado", () => {
    const base = snapshot({ modoCoordenadas: "automatico" });
    const current = snapshot({ modoCoordenadas: "manual" });
    expect(submitUiForEditSession(base, current).disabled).toBe(false);
  });

  it("solo reformateo GPS en campos (4.6 vs 4.600000): sigue deshabilitado", () => {
    const base = snapshot({
      formValues: {
        ...emptyValues(),
        nombres_apellidos_encuestado: "Juan",
        latitud: "4.600000",
        longitud: "-74.080000",
      },
    });
    const current = snapshot({
      formValues: {
        ...base.formValues,
        latitud: "4.6",
        longitud: "-74.08",
      },
    });
    const ui = submitUiForEditSession(base, current);
    expect(ui.disabled).toBe(true);
    expect(ui.showNoChangesHint).toBe(true);
  });

  it("mientras actualiza: Actualizando… y deshabilitado", () => {
    const base = snapshot();
    const current = snapshot({
      formValues: {
        ...base.formValues,
        telefono_encuestado: "3001234567",
      },
    });
    const ui = submitUiForEditSession(base, current, true);
    expect(ui).toEqual({
      label: "Actualizando…",
      disabled: true,
      showNoChangesHint: false,
    });
  });

  it("formulario nuevo no exige cambios previos", () => {
    const ui = getFormSubmitButtonState(false, false, false);
    expect(ui.label).toBe("Guardar / enviar");
    expect(ui.disabled).toBe(false);
  });
});
