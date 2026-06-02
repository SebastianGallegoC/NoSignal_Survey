import { createRoot } from "react-dom/client";
import { describe, it, expect } from "vitest";
import { act } from "react";
import { FormFieldRow } from "../FormFieldRow";
import { useForm } from "react-hook-form";
import type { FormFieldKey, FormValues } from "@/types/formFields";

function Wrapper({
  name,
  editable,
}: {
  name: FormFieldKey;
  editable?: boolean;
}) {
  const { register, control } = useForm<FormValues>({
    defaultValues: { longitud: "", latitud: "" } as FormValues,
  });
  return (
    <FormFieldRow
      name={name}
      register={register}
      control={control}
      editableGpsFields={editable}
    />
  );
}

describe("FormFieldRow editableGpsFields", () => {
  it("muestra tratamiento de datos como dos opciones directas de selección única", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<Wrapper name="autoriza_tratamiento_datos" />);
    });
    const options = Array.from(container.querySelectorAll("button"));
    const si = options.find((b) => b.textContent?.trim() === "SI") as HTMLButtonElement;
    const no = options.find((b) => b.textContent?.trim() === "NO") as HTMLButtonElement;
    expect(si).toBeTruthy();
    expect(no).toBeTruthy();
    expect(si.getAttribute("aria-pressed")).toBe("false");
    expect(no.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      si.click();
    });
    expect(si.getAttribute("aria-pressed")).toBe("true");
    expect(no.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      no.click();
    });
    expect(si.getAttribute("aria-pressed")).toBe("false");
    expect(no.getAttribute("aria-pressed")).toBe("true");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("marca campos GPS como readOnly cuando editableGpsFields=false", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<Wrapper name="latitud" editable={false} />);
    });
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("permite editar campos GPS cuando editableGpsFields=true", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<Wrapper name="latitud" editable={true} />);
    });
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.readOnly).toBe(false);
    expect(input.inputMode).toBe("text");
    expect(input.lang).toBe("en");
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("elimina comas al tipear coordenadas manuales", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<Wrapper name="longitud" editable={true} />);
    });
    const input = container.querySelector("input") as HTMLInputElement;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(input, "-74,08");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(input.value).toBe("-7408");
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
