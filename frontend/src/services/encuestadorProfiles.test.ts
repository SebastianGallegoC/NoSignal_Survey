/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EncuestadorProfileCacheRow } from "@/services/db";

const cacheStore: EncuestadorProfileCacheRow[] = [];

const cacheMocks = vi.hoisted(() => ({
  deleteByUsername: vi.fn(async (username: string) => {
    for (let i = cacheStore.length - 1; i >= 0; i -= 1) {
      if (cacheStore[i].username === username) {
        cacheStore.splice(i, 1);
      }
    }
  }),
  toArrayByUsername: vi.fn(async (username: string) =>
    cacheStore.filter((row) => row.username === username),
  ),
  bulkPut: vi.fn(async (rows: EncuestadorProfileCacheRow[]) => {
    for (const row of rows) {
      const index = cacheStore.findIndex((r) => r.id === row.id);
      if (index >= 0) {
        cacheStore[index] = row;
      } else {
        cacheStore.push(row);
      }
    }
  }),
}));

vi.mock("@/services/api", () => ({
  listEnabledEncuestadorProfilesApi: vi.fn(),
}));

vi.mock("@/services/db", () => ({
  db: {
    transaction: async (_mode: string, _table: unknown, fn: () => Promise<void>) => {
      await fn();
    },
    encuestadorProfilesCache: {
      where: () => ({
        equals: (username: string) => ({
          delete: () => cacheMocks.deleteByUsername(username),
          toArray: () => cacheMocks.toArrayByUsername(username),
        }),
      }),
      bulkPut: (rows: EncuestadorProfileCacheRow[]) => cacheMocks.bulkPut(rows),
    },
  },
}));

import { listEnabledEncuestadorProfilesApi } from "@/services/api";
import {
  listEnabledEncuestadorProfilesLocal,
  syncEnabledEncuestadorProfiles,
} from "@/services/encuestadorProfiles";

describe("encuestadorProfiles", () => {
  beforeEach(() => {
    cacheStore.length = 0;
    vi.clearAllMocks();
  });

  it("syncEnabledEncuestadorProfiles persiste id y nombre por usuario", async () => {
    vi.mocked(listEnabledEncuestadorProfilesApi).mockResolvedValue([
      { id: 2, nombre: "María López" },
      { id: 1, nombre: "Ana Pérez" },
    ]);

    const items = await syncEnabledEncuestadorProfiles("encuestador1");

    expect(items).toHaveLength(2);
    expect(cacheStore).toHaveLength(2);
    expect(cacheStore.every((row) => row.username === "encuestador1")).toBe(true);
    expect(cacheStore.find((row) => row.id === 1)?.nombre).toBe("Ana Pérez");
    expect(cacheStore.find((row) => row.id === 2)?.nombre).toBe("María López");
  });

  it("re-sync reemplaza el catálogo del usuario", async () => {
    vi.mocked(listEnabledEncuestadorProfilesApi).mockResolvedValueOnce([
      { id: 1, nombre: "Ana Pérez" },
      { id: 2, nombre: "María López" },
    ]);
    await syncEnabledEncuestadorProfiles("user-a");

    vi.mocked(listEnabledEncuestadorProfilesApi).mockResolvedValueOnce([
      { id: 3, nombre: "Carlos Ruiz" },
    ]);
    await syncEnabledEncuestadorProfiles("user-a");

    const local = await listEnabledEncuestadorProfilesLocal("user-a");
    expect(local).toEqual([{ id: 3, nombre: "Carlos Ruiz" }]);
    expect(cacheStore.some((row) => row.id === 1 || row.id === 2)).toBe(false);
  });

  it("listEnabledEncuestadorProfilesLocal ordena por nombre (es)", async () => {
    cacheStore.push(
      {
        id: 2,
        username: "user-b",
        nombre: "Zorro",
        habilitado: true,
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 1,
        username: "user-b",
        nombre: "Árbol",
        habilitado: true,
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 3,
        username: "user-b",
        nombre: "Mesa",
        habilitado: false,
        updated_at: "2026-01-01T00:00:00Z",
      },
    );

    const local = await listEnabledEncuestadorProfilesLocal("user-b");

    expect(local).toEqual([
      { id: 1, nombre: "Árbol" },
      { id: 2, nombre: "Zorro" },
    ]);
  });

  it("no mezcla perfiles de distintos usuarios", async () => {
    vi.mocked(listEnabledEncuestadorProfilesApi).mockResolvedValueOnce([
      { id: 1, nombre: "Usuario A" },
    ]);
    await syncEnabledEncuestadorProfiles("user-a");

    vi.mocked(listEnabledEncuestadorProfilesApi).mockResolvedValueOnce([
      { id: 10, nombre: "Usuario B" },
    ]);
    await syncEnabledEncuestadorProfiles("user-b");

    expect(await listEnabledEncuestadorProfilesLocal("user-a")).toEqual([
      { id: 1, nombre: "Usuario A" },
    ]);
    expect(await listEnabledEncuestadorProfilesLocal("user-b")).toEqual([
      { id: 10, nombre: "Usuario B" },
    ]);
  });
});
