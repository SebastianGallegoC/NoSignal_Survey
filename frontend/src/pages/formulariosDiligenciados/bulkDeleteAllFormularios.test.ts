import { describe, expect, it } from "vitest";

import {
  BULK_DELETE_ALL_PASSWORD,
  isBulkDeleteAllPasswordValid,
} from "@/pages/formulariosDiligenciados/bulkDeleteAllFormularios";

describe("bulkDeleteAllFormularios", () => {
  it("acepta la contraseña exacta", () => {
    expect(isBulkDeleteAllPasswordValid(BULK_DELETE_ALL_PASSWORD)).toBe(true);
  });

  it("ignora espacios al inicio y al final", () => {
    expect(isBulkDeleteAllPasswordValid(`  ${BULK_DELETE_ALL_PASSWORD}  `)).toBe(
      true,
    );
  });

  it("rechaza contraseña incorrecta o vacía", () => {
    expect(isBulkDeleteAllPasswordValid("")).toBe(false);
    expect(isBulkDeleteAllPasswordValid("123456788")).toBe(false);
    expect(isBulkDeleteAllPasswordValid("abc")).toBe(false);
  });
});
