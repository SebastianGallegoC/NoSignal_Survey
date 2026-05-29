import { act, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi, afterEach } from "vitest";

import type { RegistroFotoSlot } from "@/config/registroFotografico";
import type { FotoForm } from "@/services/db";
import { usePhotoCapture } from "@/pages/formulario/usePhotoCapture";

const compressionMocks = vi.hoisted(() => ({
  compressImageFile: vi.fn(async (file: File) => file),
  fileToDataUrl: vi.fn(async () => "data:image/jpeg;base64,AA=="),
}));

const cameraMocks = vi.hoisted(() => {
  let onCapturedFile: ((file: File) => Promise<void>) | null = null;
  let canCapture: (() => boolean) | undefined;
  let onCaptureBlocked: (() => void) | undefined;
  return {
    useCameraCapture: vi.fn(
      ({
        onCapturedFile: handler,
        canCapture: canCaptureArg,
        onCaptureBlocked: onBlocked,
      }) => {
        onCapturedFile = handler;
        canCapture = canCaptureArg;
        onCaptureBlocked = onBlocked;
        return {
          cameraOpen: false,
          captureFlash: false,
          captureBadge: null,
          cameraVideoRef: { current: null },
          openCamera: vi.fn(),
          stopCamera: vi.fn(),
          captureFromCamera: vi.fn(async () => {
            if (canCapture && !canCapture()) {
              onCaptureBlocked?.();
              return;
            }
            if (onCapturedFile) {
              await onCapturedFile(
                new File(["x"], "camera.jpg", { type: "image/jpeg" }),
              );
            }
          }),
        };
      },
    ),
  };
});

vi.mock("@/services/imageCompression", () => compressionMocks);
vi.mock("@/hooks/useCameraCapture", () => ({
  useCameraCapture: cameraMocks.useCameraCapture,
}));

type HookHandlers = ReturnType<typeof usePhotoCapture>;

type HarnessProps = {
  fotos: FotoForm[];
  activeSlot: RegistroFotoSlot | null;
  setActiveSlot: (slot: RegistroFotoSlot | null) => void;
  setFotos: (value: FotoForm[] | ((prev: FotoForm[]) => FotoForm[])) => void;
  setBanner: (value: string | null) => void;
  onReady: (handlers: HookHandlers) => void;
};

const Harness = (props: HarnessProps) => {
  const handlers = usePhotoCapture({
    fotos: props.fotos,
    setFotos: props.setFotos,
    activeSlot: props.activeSlot,
    setActiveSlot: props.setActiveSlot,
    setBanner: props.setBanner,
  });
  props.onReady(handlers);
  return null;
};

describe("usePhotoCapture", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("asigna foto al slot indicado", async () => {
    const setBanner = vi.fn();
    const setFotos = vi.fn();
    const setActiveSlot = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let handlers: HookHandlers | null = null;

    await act(async () => {
      root.render(
        <Harness
          fotos={[]}
          activeSlot={1}
          setActiveSlot={setActiveSlot}
          setFotos={setFotos}
          setBanner={setBanner}
          onReady={(h) => {
            handlers = h;
          }}
        />,
      );
    });

    const file = new File(["abc"], "foto.jpg", { type: "image/jpeg" });
    await act(async () => {
      await handlers?.onFotoFileForSlot(1, {
        target: { files: [file], value: "x" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(compressionMocks.compressImageFile).toHaveBeenCalledTimes(1);
    expect(setFotos).toHaveBeenCalledTimes(1);
    const updater = setFotos.mock.calls[0]?.[0];
    const next = (updater as (prev: FotoForm[]) => FotoForm[])([]);
    expect(next[0]?.slot).toBe(1);
    expect(next[0]?.nombre_archivo).toBe("foto.jpg");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("captura desde cámara en el slot activo", async () => {
    const setBanner = vi.fn();
    const setFotos = vi.fn();
    const setActiveSlot = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let handlers: HookHandlers | null = null;

    await act(async () => {
      root.render(
        <Harness
          fotos={[]}
          activeSlot={2}
          setActiveSlot={setActiveSlot}
          setFotos={setFotos}
          setBanner={setBanner}
          onReady={(h) => {
            handlers = h;
          }}
        />,
      );
    });

    await act(async () => {
      await handlers?.captureFromCamera();
    });

    expect(compressionMocks.compressImageFile).toHaveBeenCalledTimes(1);
    expect(setFotos).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("advierte si no hay slot activo al capturar", async () => {
    const setBanner = vi.fn();
    const setFotos = vi.fn();
    const setActiveSlot = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let handlers: HookHandlers | null = null;

    await act(async () => {
      root.render(
        <Harness
          fotos={[]}
          activeSlot={null}
          setActiveSlot={setActiveSlot}
          setFotos={setFotos}
          setBanner={setBanner}
          onReady={(h) => {
            handlers = h;
          }}
        />,
      );
    });

    await act(async () => {
      await handlers?.captureFromCamera();
    });

    expect(setBanner).toHaveBeenCalledWith(
      "Seleccioná un campo de registro fotográfico antes de tomar la foto.",
    );
    expect(setFotos).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("quitarFotoSlot elimina solo el slot indicado", async () => {
    const setBanner = vi.fn();
    const setFotos = vi.fn();
    const setActiveSlot = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let handlers: HookHandlers | null = null;

    const fotosIniciales: FotoForm[] = [
      { nombre_archivo: "a.jpg", data: "data:1", slot: 1 },
      { nombre_archivo: "b.jpg", data: "data:2", slot: 2 },
    ];

    await act(async () => {
      root.render(
        <Harness
          fotos={fotosIniciales}
          activeSlot={1}
          setActiveSlot={setActiveSlot}
          setFotos={setFotos}
          setBanner={setBanner}
          onReady={(h) => {
            handlers = h;
          }}
        />,
      );
    });

    act(() => {
      handlers?.quitarFotoSlot(1);
    });

    expect(setFotos).toHaveBeenCalledTimes(1);
    const updater = setFotos.mock.calls[0]?.[0];
    const next = (updater as (prev: FotoForm[]) => FotoForm[])(fotosIniciales);
    expect(next).toHaveLength(1);
    expect(next[0]?.slot).toBe(2);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
