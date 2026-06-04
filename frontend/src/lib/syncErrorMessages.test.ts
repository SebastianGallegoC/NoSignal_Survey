import { describe, expect, it } from "vitest";

import { formatSyncErrorForUser } from "@/lib/syncErrorMessages";

describe("formatSyncErrorForUser", () => {
  it("traduce perfil deshabilitado", () => {
    expect(
      formatSyncErrorForUser("HTTP_422: encuestador_profile_disabled"),
    ).toMatch(/ya no está habilitado/i);
  });

  it("traduce fecha de visita obligatoria", () => {
    expect(formatSyncErrorForUser("HTTP_422: fecha_visita_required")).toMatch(
      /fecha de la visita/i,
    );
  });

  it("traduce perfil no encontrado", () => {
    expect(formatSyncErrorForUser("encuestador_profile_not_found")).toMatch(
      /ya no existe/i,
    );
  });

  it("devuelve mensaje genérico para códigos HTTP desconocidos", () => {
    expect(formatSyncErrorForUser("HTTP_422: some_unknown_code")).toMatch(
      /servidor no aceptó/i,
    );
  });

  it("devuelve null si no hay texto", () => {
    expect(formatSyncErrorForUser(null)).toBeNull();
    expect(formatSyncErrorForUser("")).toBeNull();
  });
});
