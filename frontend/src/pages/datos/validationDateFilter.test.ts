import { describe, expect, it } from "vitest";

import {
  buildValidationDateRange,
  inferAnioMesFromDateRange,
  mesFiltroLabel,
} from "@/pages/datos/validationDateFilter";

describe("validationDateFilter", () => {
  it("sin año no aplica rango de fechas", () => {
    expect(buildValidationDateRange(null, null)).toEqual({
      fechaDesde: "",
      fechaHasta: "",
    });
  });

  it("año completo cubre enero a diciembre", () => {
    expect(buildValidationDateRange(2026, null)).toEqual({
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-12-31",
    });
  });

  it("año y mes acotan al mes calendario", () => {
    expect(buildValidationDateRange(2026, 2)).toEqual({
      fechaDesde: "2026-02-01",
      fechaHasta: "2026-02-28",
    });
  });

  it("infiere año y mes desde rango guardado", () => {
    expect(
      inferAnioMesFromDateRange("2026-03-01", "2026-03-31"),
    ).toEqual({ anioFiltro: 2026, mesFiltro: 3 });
  });

  it("etiqueta de mes en español", () => {
    expect(mesFiltroLabel(3)).toBe("Marzo");
  });
});
