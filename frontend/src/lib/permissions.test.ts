import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canDeleteForms,
  canManageEncuestadorProfiles,
  canManageUsers,
  isUserRole,
} from "@/lib/permissions";

describe("permissions", () => {
  it("valida roles conocidos", () => {
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("editor")).toBe(true);
    expect(isUserRole("encuestador")).toBe(true);
    expect(isUserRole("otro")).toBe(false);
  });

  it("solo admin puede gestionar usuarios", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("editor")).toBe(false);
    expect(canManageUsers("encuestador")).toBe(false);
  });

  it("admin y editor pueden eliminar formularios y gestionar perfiles", () => {
    expect(canDeleteForms("admin")).toBe(true);
    expect(canDeleteForms("editor")).toBe(true);
    expect(canDeleteForms("encuestador")).toBe(false);
    expect(canManageEncuestadorProfiles("admin")).toBe(true);
    expect(canManageEncuestadorProfiles("editor")).toBe(true);
    expect(canManageEncuestadorProfiles("encuestador")).toBe(false);
  });

  it("solo admin puede entrar a /usuarios", () => {
    expect(canAccessRoute("admin", "/usuarios")).toBe(true);
    expect(canAccessRoute("editor", "/usuarios")).toBe(false);
    expect(canAccessRoute("encuestador", "/usuarios")).toBe(false);
    expect(canAccessRoute("encuestador", "/datos")).toBe(true);
  });
});
