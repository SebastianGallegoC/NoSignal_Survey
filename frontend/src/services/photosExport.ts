import JSZip from "jszip";

import {
  isRegistroFotoSlot,
  REGISTRO_FOTO_SLOTS,
  registroFotoExportFolder,
  type RegistroFotoSlot,
} from "@/config/registroFotografico";
import type { FotoForm, OfflineForm } from "@/services/db";
import { matrizCaracterizacionFilename } from "@/services/matrizCaracterizacionExport";

function stripWindowsIllegalChars(value: string): string {
  return [...value]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && !'<>:"/\\|?*'.includes(ch);
    })
    .join("");
}

/** Nombre de carpeta raíz dentro del ZIP: `Fotos-<encuestado>` (mantiene tildes y espacios). */
export function buildBeneficiarioFolderName(form: OfflineForm): string {
  const datos = form.datos_formulario as Record<string, unknown>;
  let raw = String(datos.nombres_apellidos_encuestado ?? "").trim();
  raw = stripWindowsIllegalChars(raw);
  raw = raw.replace(/\s+/g, " ").replace(/^ +| +$/g, "");
  raw = raw.replace(/[.\s]+$/g, "");
  raw = raw.slice(0, 80);
  const inner = raw.length > 0 ? raw : "sin encuestado";
  return `Fotos-${inner}`;
}

/** Nombre del archivo .zip descargado (ASCII seguro, análogo a la matriz Excel). */
export function photosZipFilename(form: OfflineForm): string {
  return matrizCaracterizacionFilename(form).replace(/\.xlsx$/i, ".zip");
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const t = dataUrl.trim();
  if (!t.startsWith("data:")) {
    throw new Error("La foto no está en formato data URL.");
  }
  const comma = t.indexOf(",");
  if (comma === -1) {
    throw new Error("Data URL inválida (falta separador base64).");
  }
  const payload = t.slice(comma + 1).trim();
  const isBase64 = /;base64/i.test(t.slice(0, comma));
  if (!isBase64) {
    throw new Error("Solo se admiten imágenes en base64.");
  }
  try {
    const binary = atob(payload);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    throw new Error("No se pudo decodificar una imagen (base64 inválido).");
  }
}

function safeBasename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").trim() || "foto.jpg";
  return base.replace(/\.\./g, "_");
}

function uniqueNameInFolder(baseName: string, used: Set<string>): string {
  const safe = safeBasename(baseName);
  if (!used.has(safe)) {
    used.add(safe);
    return safe;
  }
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : "";
  let n = 2;
  let candidate = `${stem}-${n}${ext}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${stem}-${n}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

function resolveFotoSlot(foto: FotoForm): RegistroFotoSlot | null {
  if (isRegistroFotoSlot(foto.slot)) {
    return foto.slot;
  }
  if (
    foto.visita === 1 ||
    foto.visita === 2 ||
    foto.visita === 3 ||
    foto.visita === 4
  ) {
    return foto.visita as RegistroFotoSlot;
  }
  return null;
}

function partitionFotosBySlot(fotos: FotoForm[]): Record<RegistroFotoSlot, FotoForm[]> {
  const bySlot = Object.fromEntries(
    REGISTRO_FOTO_SLOTS.map(({ slot }) => [slot, [] as FotoForm[]]),
  ) as Record<RegistroFotoSlot, FotoForm[]>;
  for (const foto of fotos) {
    const slot = resolveFotoSlot(foto);
    if (slot != null) {
      bySlot[slot].push(foto);
    }
  }
  return bySlot;
}

function safeBeneficiarioName(form: OfflineForm): string {
  const datos = form.datos_formulario as Record<string, unknown>;
  let raw = String(datos.nombres_apellidos_encuestado ?? "").trim();
  raw = stripWindowsIllegalChars(raw);
  raw = raw.replace(/\s+/g, " ").replace(/^ +| +$/g, "");
  raw = raw.replace(/[.\s]+$/g, "");
  raw = raw.slice(0, 80);
  return raw.length > 0 ? raw : "sin encuestado";
}

function safeFechaFromForm(form: OfflineForm): string {
  const sendDate = Date.parse(form.fecha_hora);
  if (Number.isNaN(sendDate)) {
    return "sin_fecha";
  }
  const d = new Date(sendDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}_${hh}-${mm}`;
}

function bulkFormFolderName(form: OfflineForm): string {
  return `${safeBeneficiarioName(form)}-${safeFechaFromForm(form)}`;
}

export async function buildPhotosZip(form: OfflineForm): Promise<Blob> {
  const fotos = form.fotos ?? [];
  if (fotos.length === 0) {
    throw new Error("No hay fotos para exportar.");
  }

  const zip = new JSZip();
  const root = buildBeneficiarioFolderName(form);
  const bySlot = partitionFotosBySlot(fotos);

  for (const { slot } of REGISTRO_FOTO_SLOTS) {
    const list = bySlot[slot];
    if (list.length === 0) {
      continue;
    }
    const folder = `${root}/${registroFotoExportFolder(slot)}`;
    const used = new Set<string>();
    for (const foto of list) {
      const fileName = uniqueNameInFolder(foto.nombre_archivo, used);
      const bytes = dataUrlToUint8Array(foto.data);
      zip.file(`${folder}/${fileName}`, bytes);
    }
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function downloadPhotosZip(form: OfflineForm): Promise<void> {
  const blob = await buildPhotosZip(form);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = photosZipFilename(form);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function photosBulkZipFilename(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `Fotos_Formularios_${y}-${m}-${day}_${hh}-${mm}.zip`;
}

export async function buildPhotosBulkZip(forms: OfflineForm[]): Promise<Blob> {
  const zip = new JSZip();
  const root = "Fotos Formularios";
  let addedAtLeastOne = false;

  for (const form of forms) {
    const fotos = (form.fotos ?? []).filter(
      (f): f is FotoForm => typeof f?.data === "string" && f.data.trim() !== "",
    );
    if (fotos.length === 0) {
      continue;
    }
    const folderBase = `${root}/${bulkFormFolderName(form)}`;
    const bySlot = partitionFotosBySlot(fotos);
    for (const { slot } of REGISTRO_FOTO_SLOTS) {
      const list = bySlot[slot];
      if (list.length === 0) {
        continue;
      }
      const used = new Set<string>();
      const folder = `${folderBase}/${registroFotoExportFolder(slot)}`;
      for (const foto of list) {
        const fileName = uniqueNameInFolder(foto.nombre_archivo, used);
        const bytes = dataUrlToUint8Array(foto.data);
        zip.file(`${folder}/${fileName}`, bytes);
        addedAtLeastOne = true;
      }
    }
  }

  if (!addedAtLeastOne) {
    throw new Error("No hay fotos para exportar en los formularios seleccionados.");
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function downloadPhotosBulkZip(forms: OfflineForm[]): Promise<void> {
  const blob = await buildPhotosBulkZip(forms);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = photosBulkZipFilename();
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
