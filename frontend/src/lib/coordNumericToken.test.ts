import { describe, expect, it } from "vitest";

import {
  COORD_DECIMAL_COMMA_MSG,
  COORD_DECIMAL_PLACES,
  coordDecimalInputHasComma,
  formatCoordForDatosFormulario,
  formatCoordDecimalFromCell,
  formatGpsCoordDecimal,
  normalizeCoordNumericCell,
  roundCoordDecimal,
  sanitizeCoordManualInput,
  validateCoordLatLonField,
} from "./coordNumericToken";

describe("normalizeCoordNumericCell", () => {
  it.each([
    ["73°", "73"],
    ["  73 °  ", "73"],
    ["17'", "17"],
    ["17′", "17"],
    [`47''`, "47"],
    [`47″`, "47"],
    ["47,5''", "47.5"],
    ["-74.08175", "-74.08175"],
    ["  -74,1° ", "-74.1"],
    ["4.60971°", "4.60971"],
    ["°4,60971", "4.60971"],
    ["−74,08°", "-74.08"],
    ["", ""],
    ["   ", ""],
    ["solo texto", ""],
  ])("%s → %s", (input, expected) => {
    expect(normalizeCoordNumericCell(input)).toBe(expected);
  });
});

describe("sanitizeCoordManualInput", () => {
  it("elimina comas sin convertirlas a punto", () => {
    expect(sanitizeCoordManualInput("-74,08")).toBe("-7408");
    expect(sanitizeCoordManualInput("4,609")).toBe("4609");
    expect(sanitizeCoordManualInput("-74.08175")).toBe("-74.08175");
    expect(sanitizeCoordManualInput(".5")).toBe(".5");
  });

  it("detecta coma en entrada cruda", () => {
    expect(coordDecimalInputHasComma("4,5")).toBe(true);
    expect(coordDecimalInputHasComma("4.5")).toBe(false);
  });

  it("validateCoordLatLonField rechaza coma", () => {
    expect(validateCoordLatLonField("4,6", "latitud")).toBe(
      COORD_DECIMAL_COMMA_MSG,
    );
  });
});

describe("precisión GPS vs manual", () => {
  it("GPS usa 6 decimales", () => {
    expect(COORD_DECIMAL_PLACES).toBe(6);
    expect(formatGpsCoordDecimal(4.6097123456)).toBe("4.609712");
    expect(roundCoordDecimal(-74.081751234)).toBe(-74.081751);
  });

  it("manual conserva decimales del usuario", () => {
    expect(formatCoordDecimalFromCell("  -74,08° ")).toBe("-74.08");
    expect(formatCoordForDatosFormulario("4.5", "manual")).toBe("4.5");
    expect(formatCoordForDatosFormulario("4.6097123456", "manual")).toBe(
      "4.6097123456",
    );
  });

  it("automático en datos_formulario fuerza 6 decimales", () => {
    expect(formatCoordForDatosFormulario("4.6097123456", "automatico")).toBe(
      "4.609712",
    );
  });
});
