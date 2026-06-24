import { MUNICIPIO_MENSUAL_TODOS } from "@/pages/datos/MonthlyDiligenciasFilters";
import type { ResultadoValidacionFilter } from "@/constants/validationStatsFilter";
import { inferAnioMesFromDateRange } from "@/pages/datos/validationDateFilter";

export const DATOS_PAGE_PREFS_STORAGE_KEY = "nosignal_datos_page_prefs";
export const DATOS_PAGE_PREFS_TTL_MS = 30 * 60 * 1000;

export type DatosPageSectionId = "mapa" | "validacion" | "mensual";

const DEFAULT_OPEN_SECTIONS: DatosPageSectionId[] = [
  "validacion",
  "mapa",
  "mensual",
];

type DatosPagePreferencesPayloadV3 = {
  v: 3;
  savedAt: number;
  openSections: DatosPageSectionId[];
  validation: {
    municipio: string;
    anioFiltro: number | null;
    mesFiltro: number | null;
    resultadoValidacion: ResultadoValidacionFilter;
  };
  monthly: {
    anio: number;
    municipio: string;
  };
};

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
  anioFiltro: number | null;
  mesFiltro: number | null;
  anioMensual: number;
  municipioMensual: string;
};

function defaultUiState(): DatosPageUiState {
  return {
    openSections: new Set(DEFAULT_OPEN_SECTIONS),
    municipio: "",
    resultadoValidacion: "",
    anioFiltro: null,
    mesFiltro: null,
    anioMensual: new Date().getFullYear(),
    municipioMensual: MUNICIPIO_MENSUAL_TODOS,
  };
}

function isSectionId(value: string): value is DatosPageSectionId {
  return value === "mapa" || value === "validacion" || value === "mensual";
}

function parseResultadoValidacion(
  raw: unknown,
): ResultadoValidacionFilter {
  return raw === "CUMPLE" || raw === "NO CUMPLE" ? raw : "";
}

function parseStoredPreferences(
  raw: string,
): DatosPagePreferencesPayloadV3 | null {
  try {
    const parsed = JSON.parse(raw) as
      | DatosPagePreferencesPayloadV3
      | DatosPagePreferencesPayloadV2
      | DatosPagePreferencesPayloadV1;
    if (parsed.v !== 1 && parsed.v !== 2 && parsed.v !== 3) return null;
    if (!Array.isArray(parsed.openSections)) return null;
    if (!parsed.validation || typeof parsed.validation !== "object") return null;
    if (!parsed.monthly || typeof parsed.monthly !== "object") return null;

    const openSections = parsed.openSections.filter(isSectionId);
    if (openSections.length === 0) return null;

    const municipio =
      typeof parsed.validation.municipio === "string"
        ? parsed.validation.municipio
        : "";
    const resultadoValidacion = parseResultadoValidacion(
      parsed.validation.resultadoValidacion,
    );

    let anioFiltro: number | null = null;
    let mesFiltro: number | null = null;

    if (parsed.v === 3) {
      const v3 = parsed as DatosPagePreferencesPayloadV3;
      anioFiltro =
        typeof v3.validation.anioFiltro === "number" &&
        Number.isFinite(v3.validation.anioFiltro)
          ? v3.validation.anioFiltro
          : null;
      mesFiltro =
        typeof v3.validation.mesFiltro === "number" &&
        Number.isFinite(v3.validation.mesFiltro)
          ? v3.validation.mesFiltro
          : null;
    } else {
      const fechaDesde =
        typeof parsed.validation.fechaDesde === "string"
          ? parsed.validation.fechaDesde
          : "";
      const fechaHasta =
        typeof parsed.validation.fechaHasta === "string"
          ? parsed.validation.fechaHasta
          : "";
      const inferred = inferAnioMesFromDateRange(fechaDesde, fechaHasta);
      anioFiltro = inferred.anioFiltro;
      mesFiltro = inferred.mesFiltro;
    }

    const anio =
      typeof parsed.monthly.anio === "number" && Number.isFinite(parsed.monthly.anio)
        ? parsed.monthly.anio
        : new Date().getFullYear();
    const municipioMensual =
      typeof parsed.monthly.municipio === "string"
        ? parsed.monthly.municipio
        : MUNICIPIO_MENSUAL_TODOS;

    return {
      v: 3,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      openSections,
      validation: { municipio, anioFiltro, mesFiltro, resultadoValidacion },
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
    anioFiltro: stored.validation.anioFiltro,
    mesFiltro: stored.validation.mesFiltro,
    anioMensual: stored.monthly.anio,
    municipioMensual: stored.monthly.municipio,
  };
}

export function saveDatosPagePreferences(
  state: DatosPageUiState,
  now = Date.now(),
): void {
  const payload: DatosPagePreferencesPayloadV3 = {
    v: 3,
    savedAt: now,
    openSections: [...state.openSections],
    validation: {
      municipio: state.municipio,
      anioFiltro: state.anioFiltro,
      mesFiltro: state.mesFiltro,
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
