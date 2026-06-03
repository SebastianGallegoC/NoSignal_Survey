import { describe, expect, it } from "vitest";

import {
  MUNICIPIO_SIN_ASOCIAR,
  MUNICIPIO_SIN_ASOCIAR_LABEL,
  isMunicipioSinAsociar,
  municipioFilterLabel,
} from "@/constants/formStatsMunicipio";

describe("formStatsMunicipio", () => {
  it("detecta valor centinela", () => {
    expect(isMunicipioSinAsociar(MUNICIPIO_SIN_ASOCIAR)).toBe(true);
    expect(isMunicipioSinAsociar("Cúcuta")).toBe(false);
  });

  it("muestra etiqueta sin asociar", () => {
    expect(municipioFilterLabel(MUNICIPIO_SIN_ASOCIAR)).toBe(
      MUNICIPIO_SIN_ASOCIAR_LABEL,
    );
    expect(municipioFilterLabel("Cúcuta")).toBe("Cúcuta");
  });
});
