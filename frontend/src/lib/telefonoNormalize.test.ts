import { describe, expect, it } from "vitest";

import {
  isTelefonoNoTienePhrase,
  normalizeTelefonoStoredValue,
  TELEFONO_NO_TIENE_VALUE,
} from "./telefonoNormalize";

describe("telefonoNormalize", () => {
  it("canoniza variantes de «no tiene»", () => {
    expect(normalizeTelefonoStoredValue("  NO TIENE  ")).toBe(
      TELEFONO_NO_TIENE_VALUE,
    );
    expect(normalizeTelefonoStoredValue("sin teléfono")).toBe(
      TELEFONO_NO_TIENE_VALUE,
    );
    expect(normalizeTelefonoStoredValue("SIN NUMERO")).toBe(
      TELEFONO_NO_TIENE_VALUE,
    );
    expect(normalizeTelefonoStoredValue("no tiene teléfono")).toBe(
      TELEFONO_NO_TIENE_VALUE,
    );
  });

  it("no altera números u otros textos", () => {
    expect(normalizeTelefonoStoredValue("300 123 4567")).toBe("300 123 4567");
    expect(normalizeTelefonoStoredValue("")).toBe("");
    expect(isTelefonoNoTienePhrase("notiene algo")).toBe(false);
  });
});
