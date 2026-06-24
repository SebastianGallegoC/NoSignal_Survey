import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchMeApi: vi.fn(),
  loginApi: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  fetchMeApi: mocks.fetchMeApi,
  loginApi: mocks.loginApi,
}));

vi.mock("@/services/encuestadorProfiles", () => ({
  syncEnabledEncuestadorProfiles: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  decodeJwtPayload: () => ({ role: "editor", exp: Math.floor(Date.now() / 1000) + 3600 }),
  isAccessTokenValid: () => true,
}));

vi.mock("@/services/db", () => ({
  db: {
    sesionLocal: {
      get: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    },
  },
}));

import { useAuthStore } from "@/store/useAuthStore";

describe("useAuthStore session refresh", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
    localStorage.clear();
    useAuthStore.setState({
      token: "valid-token",
      username: "editor1",
      role: "editor",
      ready: true,
    });
    localStorage.setItem("nosignal_access_token", "valid-token");
    localStorage.setItem("nosignal_username", "editor1");
    localStorage.setItem("nosignal_role", "editor");
    mocks.fetchMeApi.mockReset();
    mocks.loginApi.mockReset();
  });

  it("refreshSessionFromServer actualiza el rol desde /auth/me", async () => {
    mocks.fetchMeApi.mockResolvedValue({
      id: 2,
      username: "editor1",
      role: "encuestador",
      is_active: true,
      created_at: "2026-06-20T00:00:00",
      updated_at: "2026-06-20T00:00:00",
    });

    const ok = await useAuthStore.getState().refreshSessionFromServer();

    expect(ok).toBe(true);
    expect(useAuthStore.getState().role).toBe("encuestador");
    expect(localStorage.getItem("nosignal_role")).toBe("encuestador");
  });

  it("applyLoginResponse persiste token y rol del login", async () => {
    await useAuthStore.getState().applyLoginResponse({
      access_token: "new-token",
      token_type: "bearer",
      expires_in: 3600,
      username: "editor1",
      role: "encuestador",
    });

    expect(useAuthStore.getState().role).toBe("encuestador");
    expect(useAuthStore.getState().token).toBe("new-token");
    expect(localStorage.getItem("nosignal_access_token")).toBe("new-token");
  });
});
