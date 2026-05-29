export const REGISTRO_FOTO_SLOTS = [
  {
    slot: 1,
    label:
      "Validación ubicación de la vivienda (fachada) — Foto 1",
    exportFolder: "01_Fachada",
  },
  {
    slot: 2,
    label: "Validación de las condiciones de la vivienda — Foto 2",
    exportFolder: "02_Condiciones_vivienda",
  },
  {
    slot: 3,
    label:
      "Validación de la ubicación geográfica de la vivienda — equipo GPS o terminal — Foto 3",
    exportFolder: "03_GPS_terminal",
  },
  {
    slot: 4,
    label:
      "Validación de las condiciones de la cocina de la vivienda — Foto 4",
    exportFolder: "04_Cocina",
  },
  {
    slot: 5,
    label:
      "Validación del documento de identificación del residente (parte frontal) — Foto 5",
    exportFolder: "05_Documento_frontal",
  },
  {
    slot: 6,
    label:
      "Validación del documento de identificación del residente (parte trasera) — Foto 6",
    exportFolder: "06_Documento_trasero",
  },
] as const;

export type RegistroFotoSlot = (typeof REGISTRO_FOTO_SLOTS)[number]["slot"];

export const REGISTRO_FOTO_SLOT_NUMBERS: readonly RegistroFotoSlot[] =
  REGISTRO_FOTO_SLOTS.map((item) => item.slot);

export function registroFotoLabel(slot: RegistroFotoSlot): string {
  return (
    REGISTRO_FOTO_SLOTS.find((item) => item.slot === slot)?.label ??
    `Foto ${slot}`
  );
}

export function registroFotoExportFolder(slot: RegistroFotoSlot): string {
  return (
    REGISTRO_FOTO_SLOTS.find((item) => item.slot === slot)?.exportFolder ??
    `Foto_${slot}`
  );
}

export function isRegistroFotoSlot(value: unknown): value is RegistroFotoSlot {
  return (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  );
}
