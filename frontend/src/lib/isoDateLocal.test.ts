import { describe, expect, it, vi } from "vitest";

import { getTodayIsoDateLocal, toIsoDateStringLocal } from "@/lib/isoDateLocal";

describe("isoDateLocal", () => {
  it("getTodayIsoDateLocal devuelve hoy en ISO", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15));
    expect(getTodayIsoDateLocal()).toBe("2026-06-15");
    vi.useRealTimers();
  });

  it("toIsoDateStringLocal respeta componentes locales", () => {
    expect(toIsoDateStringLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
