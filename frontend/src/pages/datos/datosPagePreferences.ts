import { MUNICIPIO_MENSUAL_TODOS } from "@/pages/datos/MonthlyDiligenciasFilters";
import type { ResultadoValidacionFilter } from "@/constants/validationStatsFilter";
import { getCurrentMonthIsoDateRange } from "@/pages/datos/datosDateDefaults";

export const DATOS_PAGE_PREFS_STORAGE_KEY = "nosignal_datos_page_prefs";
export const DATOS_PAGE_PREFS_TTL_MS = 30 * 60 * 1000;

export type DatosPageSectionId = "mapa" | "validacion" | "mensual";

const DEFAULT_OPEN_SECTIONS: DatosPageSectionId[] = [
  "validacion",
  "mapa",
  "mensual",
];

type DatosPagePreferencesPayloadV2 = {
  v: 2;
  savedAt: number;
  openSections: DatosPageSectionId[];
  validation: {
    municipio: string;
    fechaDesde: string;
    fechaHasta: string;
    resultadoValidacion: ResultadoValidacionFilter;
  };
  monthly: {
    anio: number;
    municipio: string;
  };
};

/** @deprecated v1 incluía filtros de mapa independientes; se ignoran al cargar. */
type DatosPagePreferencesPayloadV1 = Omit<
  DatosPagePreferencesPayloadV2,
  "v"
> & {
  v: 1;
  map?: {
    municipios: string[];
    fechaDesde: string;
    fechaHasta: string;
    municipiosInitialized: boolean;
  };
};

export type DatosPageUiState = {
  openSections: Set<DatosPageSectionId>;
  municipio: string;
  resultadoValidacion: ResultadoValidacionFilter;
  fechaDesde: string;
  fechaHasta: string;
  anioMensual: number;
  municipioMensual: string;
};

function defaultUiState(): DatosPageUiState {
  const { desde, hasta } = getCurrentMonthIsoDateRange();
  return {
    openSections: new Set(DEFAULT_OPEN_SECTIONS),
    municipio: "",
    resultadoValidacion: "",
    fechaDesde: desde,
    fechaHasta: hasta,
    anioMensual: new Date().getFullYear(),
    municipioMensual: MUNICIPIO_MENSUAL_TODOS,
  };
}

function isSectionId(value: string): value is DatosPageSectionId {
  return value === "mapa" || value === "validacion" || value === "mensual";
}

function parseStoredPreferences(
  raw: string,
): DatosPagePreferencesPayloadV2 | null {
  try {
    const parsed = JSON.parse(raw) as
      | DatosPagePreferencesPayloadV2
      | DatosPagePreferencesPayloadV1;
    if (parsed.v !== 1 && parsed.v !== 2) return null;
    if (!Array.isArray(parsed.openSections)) return null;
    if (!parsed.validation || typeof parsed.validation !== "object") return null;
    if (!parsed.monthly || typeof parsed.monthly !== "object") return null;

    const openSections = parsed.openSections.filter(isSectionId);
    if (openSections.length === 0) return null;

    const municipio =
      typeof parsed.validation.municipio === "string"
        ? parsed.validation.municipio
        : "";
    const fechaDesde =
      typeof parsed.validation.fechaDesde === "string"
        ? parsed.validation.fechaDesde
        : "";
    const fechaHasta =
      typeof parsed.validation.fechaHasta === "string"
        ? parsed.validation.fechaHasta
        : "";
    const resultadoValidacionRaw = parsed.validation.resultadoValidacion;
    const resultadoValidacion: ResultadoValidacionFilter =
      resultadoValidacionRaw === "CUMPLE" || resultadoValidacionRaw === "NO CUMPLE"
        ? resultadoValidacionRaw
        : "";
    const anio =
      typeof parsed.monthly.anio === "number" && Number.isFinite(parsed.monthly.anio)
        ? parsed.monthly.anio
        : new Date().getFullYear();
    const municipioMensual =
      typeof parsed.monthly.municipio === "string"
        ? parsed.monthly.municipio
        : MUNICIPIO_MENSUAL_TODOS;

    if (!fechaDesde || !fechaHasta) return null;

    return {
      v: 2,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      openSections,
      validation: { municipio, fechaDesde, fechaHasta, resultadoValidacion },
      monthly: { anio, municipio: municipioMensual },
    };
  } catch {
    return null;
  }
}

export function loadDatosPagePreferences(
  now = Date.now(),
): DatosPageUiState | null {
  const raw = sessionStorage.getItem(DATOS_PAGE_PREFS_STORAGE_KEY);
  if (!raw) return null;

  const stored = parseStoredPreferences(raw);
  if (!stored) {
    sessionStorage.removeItem(DATOS_PAGE_PREFS_STORAGE_KEY);
    return null;
  }

  if (now - stored.savedAt > DATOS_PAGE_PREFS_TTL_MS) {
    sessionStorage.removeItem(DATOS_PAGE_PREFS_STORAGE_KEY);
    return null;
  }

  return {
    openSections: new Set(stored.openSections),
    municipio: stored.validation.municipio,
    resultadoValidacion: stored.validation.resultadoValidacion,
    fechaDesde: stored.validation.fechaDesde,
    fechaHasta: stored.validation.fechaHasta,
    anioMensual: stored.monthly.anio,
    municipioMensual: stored.monthly.municipio,
  };
}

export function saveDatosPagePreferences(
  state: DatosPageUiState,
  now = Date.now(),
): void {
  const payload: DatosPagePreferencesPayloadV2 = {
    v: 2,
    savedAt: now,
    openSections: [...state.openSections],
    validation: {
      municipio: state.municipio,
      fechaDesde: state.fechaDesde,
      fechaHasta: state.fechaHasta,
      resultadoValidacion: state.resultadoValidacion,
    },
    monthly: {
      anio: state.anioMensual,
      municipio: state.municipioMensual,
    },
  };
  sessionStorage.setItem(
    DATOS_PAGE_PREFS_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function clearDatosPagePreferences(): void {
  sessionStorage.removeItem(DATOS_PAGE_PREFS_STORAGE_KEY);
}

export function getInitialDatosPageUiState(): DatosPageUiState {
  return loadDatosPagePreferences() ?? defaultUiState();
}
