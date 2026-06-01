import { useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import type { ImagePreview } from "@/components/form/ImagePreviewModal";
import { RemoveFotoConfirmModal } from "@/components/form/RemoveFotoConfirmModal";
import {
  REGISTRO_FOTO_SLOTS,
  registroFotoLabel,
  type RegistroFotoSlot,
} from "@/config/registroFotografico";
import { fotoPorSlot } from "@/lib/formPhotoLimits";
import type { FotoForm } from "@/services/db";

type Props = {
  fotos: FotoForm[];
  activeSlot: RegistroFotoSlot | null;
  onActiveSlotChange: (slot: RegistroFotoSlot | null) => void;
  pickerInputRefs: RefObject<Record<RegistroFotoSlot, HTMLInputElement | null>>;
  cameraOpen: boolean;
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  captureFlash: boolean;
  captureBadge: boolean;
  onOpenCameraForSlot: (slot: RegistroFotoSlot) => void;
  onStopCamera: () => void;
  onCaptureFromCamera: () => void;
  onFotoFileForSlot: (
    slot: RegistroFotoSlot,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onQuitarFotoSlot: (slot: RegistroFotoSlot) => void;
  onPreviewFoto: (image: ImagePreview) => void;
  cameraNotice?: string | null;
  open?: boolean;
  onToggle?: (open: boolean) => void;
};

export const RegistroFotograficoSection = ({
  fotos,
  activeSlot,
  onActiveSlotChange,
  pickerInputRefs,
  cameraOpen,
  cameraVideoRef,
  captureFlash,
  captureBadge,
  onOpenCameraForSlot,
  onStopCamera,
  onCaptureFromCamera,
  onFotoFileForSlot,
  onQuitarFotoSlot,
  onPreviewFoto,
  cameraNotice,
  open = true,
  onToggle,
}: Props) => {
  const [slotToRemove, setSlotToRemove] = useState<RegistroFotoSlot | null>(null);
  const pendingRemove = slotToRemove != null ? fotoPorSlot(fotos, slotToRemove) : undefined;
  const completedCount = REGISTRO_FOTO_SLOTS.filter(({ slot }) =>
    Boolean(fotoPorSlot(fotos, slot)),
  ).length;

  return (
    <details
      open={open}
      onToggle={(event) => onToggle?.((event.currentTarget as HTMLDetailsElement).open)}
      className="form-section-panel group"
    >
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">
        Registro fotográfico
      </summary>
      <div className="mt-3 space-y-4">
        <p className="text-xs text-slate-500">
          Las 6 fotos son obligatorias. Podés tomar la foto desde la app o elegir un archivo.
        </p>
        <p className="text-xs text-slate-600">
          Completadas: {completedCount}/6
          {completedCount < 6 ? (
            <span className="ml-2 font-medium text-amber-700">— faltan fotos obligatorias</span>
          ) : null}
        </p>

        {REGISTRO_FOTO_SLOTS.map(({ slot, label }) => {
          const foto = fotoPorSlot(fotos, slot);
          const missing = !foto;
          return (
            <div
              key={slot}
              className={`rounded-xl border p-3 ${
                missing ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  {missing ? (
                    <p className="mt-1 text-xs font-medium text-amber-800">Obligatoria</p>
                  ) : null}
                </div>
                {foto ? (
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewFoto({
                        nombre_archivo: foto.nombre_archivo,
                        src: foto.data,
                      })
                    }
                    className="shrink-0"
                  >
                    <img
                      src={foto.data}
                      alt={foto.nombre_archivo}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  </button>
                ) : null}
              </div>

              {missing ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onActiveSlotChange(slot);
                      pickerInputRefs.current[slot]?.click();
                    }}
                  >
                    Elegir archivo
                  </Button>
                  {!cameraOpen || activeSlot !== slot ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onActiveSlotChange(slot);
                        onOpenCameraForSlot(slot);
                      }}
                    >
                      Tomar foto
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSlotToRemove(slot)}
                  >
                    Quitar
                  </Button>
                </div>
              )}

              <input
                ref={(el) => {
                  pickerInputRefs.current[slot] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onFotoFileForSlot(slot, event)}
              />
            </div>
          );
        })}
      </div>

      {cameraOpen ? (
        <div className="fixed inset-0 z-[220] bg-black">
          <video
            ref={cameraVideoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          <div
            className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-150"
            style={{ opacity: captureFlash ? 0.6 : 0 }}
          />
          <div
            className={`pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-200 ${
              captureBadge ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
          >
            Foto capturada
          </div>
          {activeSlot != null ? (
            <div className="pointer-events-none absolute inset-x-4 top-16 rounded-xl bg-black/60 px-3 py-2 text-center text-xs text-white">
              {registroFotoLabel(activeSlot)}
            </div>
          ) : null}
          {cameraNotice ? (
            <div
              role="alert"
              className="absolute inset-x-3 top-3 z-10 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 py-2 text-center text-sm font-medium text-amber-950 shadow-lg"
            >
              {cameraNotice}
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:flex-row sm:justify-end">
            <Button type="button" onClick={onCaptureFromCamera}>
              Tomar foto
            </Button>
            <Button type="button" variant="outline" onClick={onStopCamera}>
              Cerrar cámara
            </Button>
          </div>
        </div>
      ) : null}

      <RemoveFotoConfirmModal
        open={slotToRemove != null}
        nombreArchivo={pendingRemove?.nombre_archivo ?? ""}
        slot={slotToRemove ?? undefined}
        onCancel={() => setSlotToRemove(null)}
        onConfirm={() => {
          if (slotToRemove != null) {
            onQuitarFotoSlot(slotToRemove);
          }
          setSlotToRemove(null);
        }}
      />
    </details>
  );
};

export function createRegistroFotoPickerRefs(): Record<
  RegistroFotoSlot,
  HTMLInputElement | null
> {
  return { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
}

export function useRegistroFotoPickerRefs() {
  return useRef<Record<RegistroFotoSlot, HTMLInputElement | null>>(
    createRegistroFotoPickerRefs(),
  );
}
