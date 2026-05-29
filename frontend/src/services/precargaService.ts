import { isRegistroFotoSlot } from '@/config/registroFotografico';
import { db, type FotoForm } from '@/services/db';
import { fetchFormFromApi, fetchFormPhotoDataUrl } from '@/services/api';

type FotoApiLike =
  | string
  | {
      nombre_archivo?: unknown;
      slot?: unknown;
      visita?: unknown;
    };

type FormApiGpsLike = {
  latitud?: unknown;
  longitud?: unknown;
  precision?: unknown;
};

/** Opciones para optimizar fotos en precarga. */
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.8;

async function optimizeDataUrl(
  dataUrl: string,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_QUALITY,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function resolveSlotFromApi(foto: FotoApiLike): FotoForm['slot'] | undefined {
  if (typeof foto === 'string') {
    return undefined;
  }
  if (isRegistroFotoSlot(foto.slot)) {
    return foto.slot;
  }
  const legacy = foto.visita;
  if (legacy === 1 || legacy === 2 || legacy === 3 || legacy === 4) {
    return legacy as FotoForm['slot'];
  }
  return undefined;
}

export async function downloadAndSavePrecarga(
  formId: string,
  options?: { optimizePhotos?: boolean; maxWidth?: number; quality?: number },
): Promise<void> {
  const opts = options ?? { optimizePhotos: true };
  const resp = await fetchFormFromApi(formId);
  const fotosRaw = Array.isArray(resp.fotos) ? resp.fotos : [];
  const fotosPromise: Promise<FotoForm | null>[] = fotosRaw.map(async (p, i) => {
    try {
      const dataUrl = await fetchFormPhotoDataUrl(formId, i);
      const finalData = opts.optimizePhotos
        ? await optimizeDataUrl(dataUrl, opts.maxWidth ?? DEFAULT_MAX_WIDTH, opts.quality ?? DEFAULT_QUALITY)
        : dataUrl;
      const foto = p as FotoApiLike;
      const nombre =
        typeof foto === 'string'
          ? (foto.split(/[/\\]/).pop() || `foto_${i + 1}.jpg`)
          : typeof foto.nombre_archivo === 'string'
            ? foto.nombre_archivo
            : `foto_${i + 1}.jpg`;
      const slot = resolveSlotFromApi(foto);
      if (slot == null) {
        return null;
      }
      return {
        nombre_archivo: nombre,
        data: finalData,
        slot,
      };
    } catch {
      return null;
    }
  });
  const fotos = (await Promise.all(fotosPromise)).filter(
    (f): f is FotoForm => f != null,
  );

  const historial = await db.historialFormularios.get(formId);
  const modoPrecarga =
    historial?.modo_coordenadas === "manual" ? "manual" : "automatico";

  await db.precargas.put({
    id_formulario: resp.id_formulario,
    fecha_precarga: new Date().toISOString(),
    modo_coordenadas: modoPrecarga,
    datos_formulario: resp.datos_formulario ?? {},
    gps:
      typeof (resp as FormApiGpsLike).latitud === 'number' &&
      typeof (resp as FormApiGpsLike).longitud === 'number'
        ? {
            latitud: (resp as FormApiGpsLike).latitud as number,
            longitud: (resp as FormApiGpsLike).longitud as number,
            precision:
              typeof (resp as FormApiGpsLike).precision === 'number'
                ? ((resp as FormApiGpsLike).precision as number)
                : undefined,
          }
        : undefined,
    fotos,
    auto_precarga: true,
  });
}

export async function enableAutoPrecarga(formId: string): Promise<void> {
  const existing = await db.precargas.get(formId);
  if (existing) {
    await db.precargas.update(formId, { auto_precarga: true });
  } else {
    await downloadAndSavePrecarga(formId);
  }
}

export async function disableAutoPrecarga(formId: string): Promise<void> {
  await db.precargas.delete(formId).catch(() => undefined);
}

export async function deletePrecarga(formId: string): Promise<void> {
  await db.precargas.delete(formId).catch(() => undefined);
}
