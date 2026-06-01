import { describe, expect, it } from "vitest";

import type { EncuestadorProfileFormState } from "@/components/encuestador/EncuestadorProfileFormFields";
import {
  encuestadorProfileFormStatesEqual,
  hasEncuestadorProfileEditChanges,
} from "@/lib/encuestadorProfileEditDirty";

const base = (): EncuestadorProfileFormState => ({
  nombres_apellidos_encuestador: "Ana Pérez",
  tipo_documento_encuestador: "CC",
  numero_documento_encuestador: "123",
  telefono_encuestador: "300",
  cargo_encuestador: "Encuestador",
  empresa_entidad_encuestador: "CENS",
  firma_encuestador: "data:image/jpeg;base64,abc",
  habilitado: true,
});

describe("encuestadorProfileEditDirty", () => {
  it("detecta cambio en un campo de texto", () => {
    const baseline = base();
    const current = { ...baseline, telefono_encuestador: "301" };
    expect(hasEncuestadorProfileEditChanges(baseline, current)).toBe(true);
  });

  it("sin cambios con espacios extra al comparar", () => {
    const baseline = base();
    const current = { ...baseline, nombres_apellidos_encuestador: "  Ana Pérez  " };
    expect(encuestadorProfileFormStatesEqual(baseline, current)).toBe(true);
    expect(hasEncuestadorProfileEditChanges(baseline, current)).toBe(false);
  });

  it("sin baseline siempre hay cambios (modo crear)", () => {
    expect(hasEncuestadorProfileEditChanges(null, base())).toBe(true);
  });
});
