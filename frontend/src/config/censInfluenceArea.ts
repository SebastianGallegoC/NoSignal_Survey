/**
 * Área de influencia CENS para mapas offline (Opción A: pack único).
 * Los nombres de municipio coinciden con `formSelectOptions.municipio`.
 */

export const CENS_INFLUENCE_PACK_ID = 'cens-influencia' as const;

/** Bounding box WGS84: [oeste, sur, este, norte] — unión aproximada del AOI. */
export const CENS_INFLUENCE_BBOX = {
  west: -74.05,
  south: 6.75,
  east: -72.0,
  north: 9.35,
} as const;

export type CensInfluenceBboxTuple = [
  west: number,
  south: number,
  east: number,
  north: number,
];

export const CENS_INFLUENCE_BBOX_TUPLE: CensInfluenceBboxTuple = [
  CENS_INFLUENCE_BBOX.west,
  CENS_INFLUENCE_BBOX.south,
  CENS_INFLUENCE_BBOX.east,
  CENS_INFLUENCE_BBOX.north,
];

/** Norte de Santander — 40 municipios (departamento completo). */
export const CENS_MUNICIPIOS_NORTE_DE_SANTANDER = [
  'Ábrego',
  'Arboledas',
  'Bochalema',
  'Bucarasica',
  'Cáchira',
  'Cácota',
  'Chinácota',
  'Chitagá',
  'Convención',
  'Cúcuta',
  'Cucutilla',
  'Durania',
  'El Carmen',
  'El Tarra',
  'El Zulia',
  'Gramalote',
  'Hacarí',
  'Herrán',
  'La Esperanza',
  'La Playa',
  'Labateca',
  'Los Patios',
  'Lourdes',
  'Mutiscua',
  'Ocaña',
  'Pamplona',
  'Pamplonita',
  'Puerto Santander (Norte de Santander)',
  'Ragonvalia',
  'Salazar',
  'San Calixto',
  'San Cayetano (Norte De Santander)',
  'Santiago (Norte de Santander)',
  'Sardinata',
  'Santo Domingo',
  'Teorama',
  'Tibú',
  'Toledo (Norte de Santander)',
  'Villa Caro',
  'Villa del Rosario',
] as const;

/** Cesar — sur del departamento (6 municipios). */
export const CENS_MUNICIPIOS_CESAR_SUR = [
  'Aguachica',
  'Gamarra',
  'González',
  'La Gloria',
  'Pelaya',
  'Río de Oro',
] as const;

/** Bolívar — municipio de Morales. */
export const CENS_MUNICIPIOS_BOLIVAR = ['Morales (Bolívar)'] as const;

/** 47 municipios del área de influencia CENS. */
export const CENS_INFLUENCE_MUNICIPIOS = [
  ...CENS_MUNICIPIOS_NORTE_DE_SANTANDER,
  ...CENS_MUNICIPIOS_CESAR_SUR,
  ...CENS_MUNICIPIOS_BOLIVAR,
] as const;

export type CensInfluenceMunicipio = (typeof CENS_INFLUENCE_MUNICIPIOS)[number];

const CENS_MUNICIPIO_SET = new Set<string>(CENS_INFLUENCE_MUNICIPIOS);

export function isMunicipioInCensInfluence(municipio: string): boolean {
  return CENS_MUNICIPIO_SET.has(municipio.trim());
}

/** Ruta del manifiesto (JSON) servido por la PWA o CDN. */
export function getCensOfflineMapManifestUrl(): string {
  const fromEnv = import.meta.env.VITE_CENS_OFFLINE_MAP_MANIFEST_URL as
    | string
    | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim();
  }
  return '/maps/cens-influencia.manifest.json';
}
