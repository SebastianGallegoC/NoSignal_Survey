import {
  isRegistroFotoSlot,
  REGISTRO_FOTO_SLOT_NUMBERS,
  type RegistroFotoSlot,
} from "@/config/registroFotografico";
import type { FotoForm } from "@/services/db";

/** Convierte fotos legacy (visita 1–4) o sin slot al modelo Survey por slot 1–6. */
export function normalizeFotosToSlots(source: FotoForm[]): FotoForm[] {
  const out: FotoForm[] = [];
  const used = new Set<RegistroFotoSlot>();

  for (const raw of source) {
    let slot: RegistroFotoSlot | null = null;
    if (isRegistroFotoSlot(raw.slot)) {
      slot = raw.slot;
    } else if (
      raw.visita === 1 ||
      raw.visita === 2 ||
      raw.visita === 3 ||
      raw.visita === 4
    ) {
      slot = raw.visita as RegistroFotoSlot;
    }

    if (slot == null || used.has(slot)) {
      continue;
    }
    used.add(slot);
    out.push({
      nombre_archivo: raw.nombre_archivo,
      data: raw.data,
      slot,
    });
  }

  return out.sort((a, b) => a.slot - b.slot);
}

export function fotosConSlotDesdeDetalle(source: Array<{
  nombre_archivo: string;
  data?: string;
  slot?: unknown;
  visita?: unknown;
  path?: string;
  serverFormId?: string;
  serverIndex?: number;
}>): FotoForm[] {
  const mapped: FotoForm[] = [];
  for (const item of source) {
    if (typeof item.data !== "string" || item.data.trim() === "") {
      continue;
    }
    let slot: RegistroFotoSlot | null = null;
    if (isRegistroFotoSlot(item.slot)) {
      slot = item.slot;
    } else if (
      item.visita === 1 ||
      item.visita === 2 ||
      item.visita === 3 ||
      item.visita === 4
    ) {
      slot = item.visita as RegistroFotoSlot;
    }
    if (slot == null) {
      continue;
    }
    mapped.push({
      nombre_archivo: item.nombre_archivo,
      data: item.data,
      slot,
    });
  }
  return normalizeFotosToSlots(mapped);
}

export function missingSlotsMessage(fotos: FotoForm[]): string {
  const present = new Set(
    fotos
      .map((f) => f.slot)
      .filter((slot): slot is RegistroFotoSlot => isRegistroFotoSlot(slot)),
  );
  const missing = REGISTRO_FOTO_SLOT_NUMBERS.filter((slot) => !present.has(slot));
  if (missing.length === 0) {
    return "";
  }
  return `Faltan fotos obligatorias: ${missing.map((slot) => `Foto ${slot}`).join(", ")}.`;
}
