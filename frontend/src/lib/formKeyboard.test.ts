import type { KeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { handleDiligenciadoFormEnterKey } from "./formKeyboard";

describe("handleDiligenciadoFormEnterKey", () => {
  it("hace blur del campo activo y previene default en Enter", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const blur = vi.spyOn(input, "blur");

    const preventDefault = vi.fn();
    handleDiligenciadoFormEnterKey({
      key: "Enter",
      target: input,
      preventDefault,
    } as unknown as KeyboardEvent<HTMLFormElement>);

    expect(preventDefault).toHaveBeenCalled();
    expect(blur).toHaveBeenCalled();
    input.remove();
  });

  it("no hace blur en combobox (lo maneja SearchableSelect)", () => {
    const input = document.createElement("input");
    input.setAttribute("role", "combobox");
    document.body.appendChild(input);
    input.focus();
    const blur = vi.spyOn(input, "blur");
    const preventDefault = vi.fn();

    handleDiligenciadoFormEnterKey({
      key: "Enter",
      target: input,
      preventDefault,
    } as unknown as KeyboardEvent<HTMLFormElement>);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(blur).not.toHaveBeenCalled();
    input.remove();
  });

  it("no interviene en textarea (salto de línea)", () => {
    const ta = document.createElement("textarea");
    const preventDefault = vi.fn();
    handleDiligenciadoFormEnterKey({
      key: "Enter",
      target: ta,
      preventDefault,
    } as unknown as KeyboardEvent<HTMLFormElement>);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
