import { describe, expect, it } from "vitest";

import { buildMapPointsQueryFromValidationFilters } from "@/pages/datos/datosMapQuery";

describe("buildMapPointsQueryFromValidationFilters", () => {
  it("usa un municipio específico cuando está seleccionado", () => {
    expect(
      buildMapPointsQueryFromValidationFilters(
        "Cúcuta",
        "2026-06-01",
        "2026-06-30",
        ["Cúcuta", "Medellín"],
      ),
    ).toEqual({
      municipios: ["Cúcuta"],
      fecha_desde: "2026-06-01",
      fecha_hasta: "2026-06-30",
    });
  });

  it("incluye todos los municipios cuando no hay filtro de municipio", () => {
    expect(
      buildMapPointsQueryFromValidationFilters(
        "",
        "2026-06-01",
        "2026-06-30",
        ["Cúcuta", "Medellín"],
      ),
    ).toEqual({
      municipios: ["Cúcuta", "Medellín"],
      fecha_desde: "2026-06-01",
      fecha_hasta: "2026-06-30",
    });
  });

  it("incluye resultado_validacion cuando está seleccionado", () => {
    expect(
      buildMapPointsQueryFromValidationFilters(
        "",
        "2026-06-01",
        "2026-06-30",
        ["Cúcuta"],
        "NO CUMPLE",
      ),
    ).toEqual({
      municipios: ["Cúcuta"],
      fecha_desde: "2026-06-01",
      fecha_hasta: "2026-06-30",
      resultado_validacion: "NO CUMPLE",
    });
  });
});
