import type { RegistroFotoSlot } from "@/config/registroFotografico";
import {
  isRegistroFotoSlot,
  REGISTRO_FOTO_SLOT_NUMBERS,
} from "@/config/registroFotografico";
import type { FotoForm } from "@/services/db";

export const MAX_FORM_PHOTOS = 6;
export const REQUIRED_FORM_PHOTOS = 6;

export const FORM_PHOTO_LIMIT_MESSAGE =
  "Ya completaste las 6 fotos del registro fotográfico.";

export const FORM_PHOTO_REQUIRED_MESSAGE =
  "Completá las 6 fotos del registro fotográfico antes de enviar.";

export function fotoPorSlot(
  fotos: FotoForm[],
  slot: RegistroFotoSlot,
): FotoForm | undefined {
  return fotos.find((foto) => foto.slot === slot);
}

export function slotsPresentes(fotos: FotoForm[]): Set<RegistroFotoSlot> {
  const out = new Set<RegistroFotoSlot>();
  for (const foto of fotos) {
    if (isRegistroFotoSlot(foto.slot)) {
      out.add(foto.slot);
    }
  }
  return out;
}

export function slotsCompletos(fotos: FotoForm[]): boolean {
  const present = slotsPresentes(fotos);
  return REGISTRO_FOTO_SLOT_NUMBERS.every((slot) => present.has(slot));
}

export function slotsFaltantes(fotos: FotoForm[]): RegistroFotoSlot[] {
  const present = slotsPresentes(fotos);
  return REGISTRO_FOTO_SLOT_NUMBERS.filter((slot) => !present.has(slot));
}

export function upsertFotoEnSlot(
  fotos: FotoForm[],
  slot: RegistroFotoSlot,
  foto: Omit<FotoForm, "slot">,
): FotoForm[] {
  const next = fotos.filter((item) => item.slot !== slot);
  next.push({ ...foto, slot });
  return next.sort((a, b) => a.slot - b.slot);
}

export function quitarFotoDeSlot(
  fotos: FotoForm[],
  slot: RegistroFotoSlot,
): FotoForm[] {
  return fotos.filter((item) => item.slot !== slot);
}

export function defaultNombreArchivoRegistroFoto(slot: RegistroFotoSlot): string {
  return `registro_foto_${slot}.jpg`;
}
