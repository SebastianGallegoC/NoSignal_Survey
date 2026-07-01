import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CENS_INFLUENCE_PACK_ID } from '@/config/censInfluenceArea';
import type { OfflineMapPackMeta } from '@/types/offlineMapPack';

const metaStore = new Map<string, OfflineMapPackMeta>();
const cacheStore = new Map<string, Response>();

const dbMocks = vi.hoisted(() => ({
  get: vi.fn(async (packId: string) => metaStore.get(packId)),
  put: vi.fn(async (row: OfflineMapPackMeta) => {
    metaStore.set(row.packId, row);
  }),
  clear: vi.fn(async () => {
    metaStore.clear();
  }),
}));

vi.mock('@/services/db', () => ({
  db: {
    offlineMapPackMeta: {
      get: dbMocks.get,
      put: dbMocks.put,
      clear: dbMocks.clear,
    },
  },
}));

import {
  OFFLINE_MAP_CACHE_NAME,
  fetchCensOfflineMapManifest,
  isCensOfflineMapPackReady,
  resetOfflineMapPackSyncForTests,
  syncCensOfflineMapPackInBackground,
} from '@/services/offlineMapPack';

function mockCachesApi() {
  vi.stubGlobal('caches', {
    open: vi.fn(async (name: string) => {
      if (name !== OFFLINE_MAP_CACHE_NAME) {
        throw new Error(`unexpected_cache_${name}`);
      }
      return {
        match: vi.fn(async (url: string) => cacheStore.get(url)),
        put: vi.fn(async (url: string, response: Response) => {
          cacheStore.set(url, response);
        }),
        keys: vi.fn(async () =>
          [...cacheStore.keys()].map((url) => new Request(url)),
        ),
        delete: vi.fn(async (request: Request) => cacheStore.delete(request.url)),
      };
    }),
  });
}

describe('offlineMapPack', () => {
  beforeEach(() => {
    resetOfflineMapPackSyncForTests();
    metaStore.clear();
    cacheStore.clear();
    dbMocks.get.mockClear();
    dbMocks.put.mockClear();
    dbMocks.clear.mockClear();
    mockCachesApi();
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfflineMapPackSyncForTests();
  });

  it('fetchCensOfflineMapManifest valida el contrato JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            packId: CENS_INFLUENCE_PACK_ID,
            version: '2026.06.1',
            pmtilesUrl: '/maps/cens-influencia.pmtiles',
            byteLength: 128,
            bbox: [-74, 6, -72, 9],
            attribution: '© OSM',
          }),
          { status: 200 },
        ),
      ),
    );

    const manifest = await fetchCensOfflineMapManifest();
    expect(manifest.version).toBe('2026.06.1');
  });

  it('syncCensOfflineMapPackInBackground guarda pack y metadatos', async () => {
    const packBytes = new Uint8Array([0x50, 0x4d, 0x54, 0x69]);

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              packId: CENS_INFLUENCE_PACK_ID,
              version: '2026.06.2',
              pmtilesUrl: '/maps/cens-influencia.pmtiles',
              byteLength: packBytes.length,
              bbox: [-74, 6, -72, 9],
              attribution: '© OSM · CENS',
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(packBytes, {
            status: 200,
            headers: { 'Content-Type': 'application/octet-stream' },
          }),
        ),
    );

    await syncCensOfflineMapPackInBackground();

    expect(dbMocks.put).toHaveBeenCalled();
    expect(await isCensOfflineMapPackReady()).toBe(true);
  });

  it('no vuelve a descargar si la versión instalada coincide', async () => {
    const resourceUrl = new URL(
      '/maps/cens-influencia.pmtiles',
      window.location.origin,
    ).href;
    const packBytes = new Uint8Array([1, 2, 3, 4]);
    cacheStore.set(resourceUrl, new Response(packBytes, { status: 200 }));
    metaStore.set(CENS_INFLUENCE_PACK_ID, {
      packId: CENS_INFLUENCE_PACK_ID,
      version: '2026.06.2',
      resourceUrl,
      byteLength: packBytes.length,
      downloadedAt: new Date().toISOString(),
      attribution: '© OSM',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            packId: CENS_INFLUENCE_PACK_ID,
            version: '2026.06.2',
            pmtilesUrl: '/maps/cens-influencia.pmtiles',
            byteLength: packBytes.length,
            bbox: [-74, 6, -72, 9],
            attribution: '© OSM',
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await syncCensOfflineMapPackInBackground();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
