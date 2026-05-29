import { describe, expect, it } from "vitest";

import { earliestIso } from "./formatDateTime";

describe("earliestIso", () => {
  it("elige la fecha más temprana", () => {
    expect(
      earliestIso("2026-01-10T08:00:00.000Z", "2026-06-15T18:00:00.000Z"),
    ).toBe("2026-01-10T08:00:00.000Z");
  });

  it("devuelve la única válida", () => {
    expect(earliestIso(undefined, "2026-05-01T12:00:00Z")).toBe("2026-05-01T12:00:00Z");
    expect(earliestIso("2026-05-01T12:00:00Z", "")).toBe("2026-05-01T12:00:00Z");
  });
});
