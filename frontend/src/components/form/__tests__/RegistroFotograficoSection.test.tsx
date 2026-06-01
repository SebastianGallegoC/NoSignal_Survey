import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import {
  RegistroFotograficoSection,
  createRegistroFotoPickerRefs,
} from "@/components/form/RegistroFotograficoSection";

/** JPEG mínimo válido (1×1 px) en data URL. */
const JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBkNDRkYGBk1KysrNTY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("RegistroFotograficoSection", () => {
  it("muestra las 6 filas y la foto cargada", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const pickerInputRefs = { current: createRegistroFotoPickerRefs() };

    await act(async () => {
      root.render(
        <RegistroFotograficoSection
          fotos={[{ nombre_archivo: "test.jpg", data: JPEG, slot: 2 }]}
          activeSlot={null}
          onActiveSlotChange={vi.fn()}
          pickerInputRefs={pickerInputRefs}
          cameraOpen={false}
          cameraVideoRef={{ current: null }}
          captureFlash={false}
          captureBadge={false}
          onOpenCameraForSlot={vi.fn()}
          onStopCamera={vi.fn()}
          onCaptureFromCamera={vi.fn()}
          onFotoFileForSlot={vi.fn()}
          onQuitarFotoSlot={vi.fn()}
          onPreviewFoto={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("Registro fotográfico");
    expect(container.textContent).toContain("Completadas: 1/6");
    expect(container.textContent).toContain("Foto 2");
    expect(container.querySelector("img")).toBeTruthy();
    expect(
      Array.from(container.querySelectorAll("button")).filter((btn) =>
        btn.textContent?.includes("Elegir archivo"),
      ),
    ).toHaveLength(5);
    expect(
      Array.from(container.querySelectorAll("button")).filter((btn) =>
        btn.textContent?.includes("Tomar foto"),
      ),
    ).toHaveLength(5);
    expect(
      Array.from(container.querySelectorAll("button")).filter((btn) =>
        btn.textContent?.includes("Quitar"),
      ),
    ).toHaveLength(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
