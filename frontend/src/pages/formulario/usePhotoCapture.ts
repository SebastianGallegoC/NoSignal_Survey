import { useCallback } from 'react';
import type { ChangeEvent, MutableRefObject } from 'react';

import type { RegistroFotoSlot } from '@/config/registroFotografico';
import {
  defaultNombreArchivoRegistroFoto,
  upsertFotoEnSlot,
  quitarFotoDeSlot,
} from '@/lib/formPhotoLimits';
import { compressImageFile, fileToDataUrl } from '@/services/imageCompression';
import type { FotoForm } from '@/services/db';
import { useCameraCapture } from '@/hooks/useCameraCapture';

type Args = {
  fotos: FotoForm[];
  setFotos: (value: FotoForm[] | ((prev: FotoForm[]) => FotoForm[])) => void;
  activeSlot: RegistroFotoSlot | null;
  setActiveSlot: (slot: RegistroFotoSlot | null) => void;
  setBanner: (value: string | null) => void;
};

type UsePhotoCaptureResult = {
  cameraOpen: boolean;
  captureFlash: boolean;
  captureBadge: boolean;
  cameraVideoRef: MutableRefObject<HTMLVideoElement | null>;
  openCameraForSlot: (slot: RegistroFotoSlot) => void;
  stopCamera: () => void;
  captureFromCamera: () => Promise<void>;
  onFotoFileForSlot: (
    slot: RegistroFotoSlot,
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  quitarFotoSlot: (slot: RegistroFotoSlot) => void;
};

export const usePhotoCapture = ({
  setFotos,
  activeSlot,
  setActiveSlot,
  setBanner,
}: Args): UsePhotoCaptureResult => {
  const setFotoEnSlot = useCallback(
    async (slot: RegistroFotoSlot, file: File) => {
      setBanner(null);
      try {
        const compressed = await compressImageFile(file);
        const data = await fileToDataUrl(compressed);
        const nombre =
          compressed.name.replace(/[^\w.-]+/g, '_') ||
          defaultNombreArchivoRegistroFoto(slot);
        setFotos((prev) =>
          upsertFotoEnSlot(prev, slot, { nombre_archivo: nombre, data }),
        );
      } catch {
        setBanner('No se pudo procesar la imagen. Probá con otra foto.');
      }
    },
    [setBanner, setFotos],
  );

  const onFotoFileForSlot = useCallback(
    async (slot: RegistroFotoSlot, event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }
      await setFotoEnSlot(slot, file);
    },
    [setFotoEnSlot],
  );

  const {
    cameraOpen,
    captureFlash,
    captureBadge,
    cameraVideoRef,
    openCamera,
    stopCamera,
    captureFromCamera,
  } = useCameraCapture({
    onCapturedFile: async (file) => {
      if (activeSlot == null) {
        setBanner('Seleccioná un campo de registro fotográfico antes de tomar la foto.');
        return;
      }
      await setFotoEnSlot(activeSlot, file);
    },
    setBanner,
    canCapture: () => activeSlot != null,
    onCaptureBlocked: () =>
      setBanner('Seleccioná un campo de registro fotográfico antes de tomar la foto.'),
  });

  const openCameraForSlot = useCallback(
    (slot: RegistroFotoSlot) => {
      setActiveSlot(slot);
      setBanner(null);
      openCamera();
    },
    [openCamera, setActiveSlot, setBanner],
  );

  const quitarFotoSlot = useCallback(
    (slot: RegistroFotoSlot) => {
      setFotos((prev) => quitarFotoDeSlot(prev, slot));
    },
    [setFotos],
  );

  return {
    cameraOpen,
    captureFlash,
    captureBadge,
    cameraVideoRef,
    openCameraForSlot,
    stopCamera,
    captureFromCamera,
    onFotoFileForSlot,
    quitarFotoSlot,
  };
};
