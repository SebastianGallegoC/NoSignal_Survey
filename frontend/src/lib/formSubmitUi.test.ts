import { describe, expect, it } from "vitest";

import { getFormSubmitButtonState } from "@/lib/formSubmitUi";

describe("getFormSubmitButtonState", () => {
  it("formulario nuevo: Guardar / enviar habilitado", () => {
    expect(getFormSubmitButtonState(false, true, false)).toEqual({
      label: "Guardar / enviar",
      disabled: false,
      showNoChangesHint: false,
    });
  });

  it("edición sin cambios: Actualizar deshabilitado y aviso", () => {
    expect(getFormSubmitButtonState(true, false, false)).toEqual({
      label: "Actualizar",
      disabled: true,
      showNoChangesHint: true,
    });
  });

  it("edición con cambios: Actualizar habilitado", () => {
    expect(getFormSubmitButtonState(true, true, false)).toEqual({
      label: "Actualizar",
      disabled: false,
      showNoChangesHint: false,
    });
  });

  it("mientras envía en edición: Actualizando… y deshabilitado", () => {
    expect(getFormSubmitButtonState(true, true, true)).toEqual({
      label: "Actualizando…",
      disabled: true,
      showNoChangesHint: false,
    });
  });

  it("mientras guarda formulario nuevo: Guardando…", () => {
    expect(getFormSubmitButtonState(false, false, true)).toEqual({
      label: "Guardando…",
      disabled: true,
      showNoChangesHint: false,
    });
  });
});
