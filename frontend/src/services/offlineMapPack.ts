import {
  CENS_INFLUENCE_PACK_ID,
  getCensOfflineMapManifestUrl,
} from '@/config/censInfluenceArea';
import { db } from '@/services/db';
import type {
  CensOfflineMapManifest,
  OfflineMapPackMeta,
} from '@/types/offlineMapPack';

export const OFFLINE_MAP_CACHE_NAME = 'cens-offline-maps-v1';

const MANIFEST_FETCH_TIMEOUT_MS = 12_000;
const PACK_FETCH_TIMEOUT_MS = 30 * 60 * 1000;

let syncInFlight: Promise<void> | null = null;

function resolveResourceUrl(relativeOrAbsolute: string): string {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  return new URL(relativeOrAbsolute, `${base}/`).toString();
}

function isValidManifest(value: unknown): value is CensOfflineMapManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    o.packId === CENS_INFLUENCE_PACK_ID &&
    typeof o.version === 'string' &&
    o.version.trim().length > 0 &&
    typeof o.pmtilesUrl === 'string' &&
    o.pmtilesUrl.trim().length > 0 &&
    Array.isArray(o.bbox) &&
    o.bbox.length === 4 &&
    typeof o.attribution === 'string'
  );
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchCensOfflineMapManifest(): Promise<CensOfflineMapManifest> {
  const url = getCensOfflineMapManifestUrl();
  const response = await fetchWithTimeout(
    url,
    { cache: 'no-cache' },
    MANIFEST_FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    throw new Error(`manifest_http_${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isValidManifest(body)) {
    throw new Error('manifest_invalid');
  }
  return body;
}

export async function getInstalledOfflineMapPackMeta(): Promise<
  OfflineMapPackMeta | undefined
> {
  return db.offlineMapPackMeta.get(CENS_INFLUENCE_PACK_ID);
}

export async function isCensOfflineMapPackReady(): Promise<boolean> {
  const meta = await getInstalledOfflineMapPackMeta();
  if (!meta) {
    return false;
  }
  if (typeof caches === 'undefined') {
    return false;
  }
  const cache = await caches.open(OFFLINE_MAP_CACHE_NAME);
  const cached = await cache.match(meta.resourceUrl);
  return Boolean(cached?.ok);
}

async function persistPackMeta(meta: OfflineMapPackMeta): Promise<void> {
  await db.offlineMapPackMeta.put(meta);
}

async function downloadPackToCache(
  resourceUrl: string,
  signal?: AbortSignal,
): Promise<{ byteLength: number }> {
  const response = await fetchWithTimeout(
    resourceUrl,
    { cache: 'no-store', signal },
    PACK_FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    throw new Error(`pack_http_${response.status}`);
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('pack_empty');
  }
  const cache = await caches.open(OFFLINE_MAP_CACHE_NAME);
  await cache.put(
    resourceUrl,
    new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(blob.size),
      },
    }),
  );
  return { byteLength: blob.size };
}

async function removeStalePackEntries(keepUrl: string): Promise<void> {
  const cache = await caches.open(OFFLINE_MAP_CACHE_NAME);
  const keys = await cache.keys();
  await Promise.all(
    keys
      .filter((req) => req.url !== keepUrl)
      .map((req) => cache.delete(req)),
  );
}

/**
 * Descarga silenciosa del pack CENS si falta o cambió la versión del manifiesto.
 * Idempotente: llamadas concurrentes comparten la misma promesa.
 */
export async function syncCensOfflineMapPackInBackground(
  signal?: AbortSignal,
): Promise<void> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    if (typeof caches === 'undefined') {
      return;
    }

    const manifest = await fetchCensOfflineMapManifest();
    const resourceUrl = resolveResourceUrl(manifest.pmtilesUrl);
    const installed = await getInstalledOfflineMapPackMeta();

    if (
      installed &&
      installed.version === manifest.version &&
      installed.resourceUrl === resourceUrl
    ) {
      const cache = await caches.open(OFFLINE_MAP_CACHE_NAME);
      const cached = await cache.match(resourceUrl);
      if (cached?.ok) {
        return;
      }
    }

    const { byteLength } = await downloadPackToCache(resourceUrl, signal);
    await removeStalePackEntries(resourceUrl);
    await persistPackMeta({
      packId: CENS_INFLUENCE_PACK_ID,
      version: manifest.version,
      resourceUrl,
      byteLength,
      downloadedAt: new Date().toISOString(),
      attribution: manifest.attribution,
    });
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export type ResolvedCensOfflineMapPack = {
  blobUrl: string;
  attribution: string;
  version: string;
};

/**
 * Devuelve una object URL del pack instalado o `null` si aún no está listo.
 * El llamador debe invocar `URL.revokeObjectURL` al desmontar.
 */
export async function resolveCensOfflineMapPackBlobUrl(): Promise<ResolvedCensOfflineMapPack | null> {
  const meta = await getInstalledOfflineMapPackMeta();
  if (!meta || typeof caches === 'undefined') {
    return null;
  }
  const cache = await caches.open(OFFLINE_MAP_CACHE_NAME);
  const cached = await cache.match(meta.resourceUrl);
  if (!cached?.ok) {
    return null;
  }
  const blob = await cached.blob();
  if (blob.size === 0) {
    return null;
  }

  return {
    blobUrl: URL.createObjectURL(blob),
    attribution: meta.attribution,
    version: meta.version,
  };
}

/** Expuesto para pruebas: reinicia el candado de descarga en curso. */
export function resetOfflineMapPackSyncForTests(): void {
  syncInFlight = null;
}
