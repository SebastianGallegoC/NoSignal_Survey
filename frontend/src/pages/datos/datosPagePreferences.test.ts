import { afterEach, describe, expect, it, vi } from "vitest";

import { MUNICIPIO_MENSUAL_TODOS } from "@/pages/datos/MonthlyDiligenciasFilters";
import {
  DATOS_PAGE_PREFS_STORAGE_KEY,
  DATOS_PAGE_PREFS_TTL_MS,
  clearDatosPagePreferences,
  getInitialDatosPageUiState,
  loadDatosPagePreferences,
  saveDatosPagePreferences,
} from "@/pages/datos/datosPagePreferences";

describe("datosPagePreferences", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("guarda y restaura secciones y filtros", () => {
    saveDatosPagePreferences(
      {
        openSections: new Set(["mapa"]),
        municipio: "Cúcuta",
        resultadoValidacion: "NO CUMPLE",
        anioFiltro: 2026,
        mesFiltro: 1,
        anioMensual: 2025,
        municipioMensual: "Medellín",
      },
      1_000,
    );

    const restored = loadDatosPagePreferences(1_000);
    expect(restored).not.toBeNull();
    expect(restored?.openSections).toEqual(new Set(["mapa"]));
    expect(restored?.municipio).toBe("Cúcuta");
    expect(restored?.anioMensual).toBe(2025);
    expect(restored?.anioFiltro).toBe(2026);
    expect(restored?.mesFiltro).toBe(1);
    expect(restored?.resultadoValidacion).toBe("NO CUMPLE");
  });

  it("migra preferencias v2 con fechas a año y mes", () => {
    sessionStorage.setItem(
      DATOS_PAGE_PREFS_STORAGE_KEY,
      JSON.stringify({
        v: 2,
        savedAt: 1_000,
        openSections: ["validacion"],
        validation: {
          municipio: "",
          fechaDesde: "2026-03-01",
          fechaHasta: "2026-03-31",
          resultadoValidacion: "",
        },
        monthly: { anio: 2026, municipio: MUNICIPIO_MENSUAL_TODOS },
      }),
    );

    const restored = loadDatosPagePreferences(1_000);
    expect(restored?.anioFiltro).toBe(2026);
    expect(restored?.mesFiltro).toBe(3);
  });

  it("expira preferencias después de 30 minutos", () => {
    saveDatosPagePreferences(
      {
        openSections: new Set(["validacion"]),
        municipio: "",
        resultadoValidacion: "",
        anioFiltro: null,
        mesFiltro: null,
        anioMensual: 2026,
        municipioMensual: MUNICIPIO_MENSUAL_TODOS,
      },
      0,
    );

    expect(loadDatosPagePreferences(DATOS_PAGE_PREFS_TTL_MS)).not.toBeNull();
    expect(loadDatosPagePreferences(DATOS_PAGE_PREFS_TTL_MS + 1)).toBeNull();
    expect(sessionStorage.getItem(DATOS_PAGE_PREFS_STORAGE_KEY)).toBeNull();
  });

  it("getInitialDatosPageUiState usa defaults si no hay preferencias", () => {
    clearDatosPagePreferences();
    const initial = getInitialDatosPageUiState();
    expect(initial.openSections.has("mapa")).toBe(true);
    expect(initial.openSections.has("validacion")).toBe(true);
    expect(initial.openSections.has("mensual")).toBe(true);
    expect(initial.municipio).toBe("");
    expect(initial.anioFiltro).toBeNull();
    expect(initial.mesFiltro).toBeNull();
  });
});
