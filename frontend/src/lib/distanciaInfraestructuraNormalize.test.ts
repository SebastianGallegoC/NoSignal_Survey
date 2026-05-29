import { describe, expect, it } from "vitest";

import { normalizeDistanciaInfraestructuraMetersCell } from "./distanciaInfraestructuraNormalize";

/** Utilidad legada (parseo a metros); la importación ya no la usa. */
describe("normalizeDistanciaInfraestructuraMetersCell", () => {
  it.each([
    ["40 m", "40"],
    ["40m", "40"],
    ["40M", "40"],
    ["40 M", "40"],
    ["  12,5 M  ", "12.5"],
    ["100", "100"],
    ["-3 m", "-3"],
    ["-3 M", "-3"],
    ["", ""],
    ["solo", ""],
  ])("%s → %s", (input, expected) => {
    expect(normalizeDistanciaInfraestructuraMetersCell(input)).toBe(expected);
  });

  it("acepta M de ancho completo (Unicode) al final", () => {
    expect(normalizeDistanciaInfraestructuraMetersCell("40\uFF2D")).toBe("40");
  });
});
