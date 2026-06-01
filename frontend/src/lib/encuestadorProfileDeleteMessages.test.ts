import { describe, expect, it } from "vitest";

import {
  encuestadorProfileDeleteBlockedMessage,
  isEncuestadorProfileInUseError,
} from "@/lib/encuestadorProfileDeleteMessages";
import { EncuestadorProfileApiError } from "@/services/api";

describe("encuestadorProfileDeleteMessages", () => {
  it("detecta perfil en uso por código 409", () => {
    expect(
      isEncuestadorProfileInUseError(
        new EncuestadorProfileApiError(409, "encuestador_profile_in_use"),
      ),
    ).toBe(true);
  });

  it("mensaje de bloqueo menciona formularios vinculados", () => {
    expect(encuestadorProfileDeleteBlockedMessage()).toMatch(/formularios/i);
    expect(encuestadorProfileDeleteBlockedMessage()).toMatch(/deshabilit/i);
  });
});
