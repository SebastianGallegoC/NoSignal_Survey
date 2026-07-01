import type { CensInfluenceBboxTuple } from '@/config/censInfluenceArea';

export type OfflineMapPackId = 'cens-influencia';

export interface CensOfflineMapManifest {
  packId: OfflineMapPackId;
  version: string;
  pmtilesUrl: string;
  byteLength: number | null;
  bbox: CensInfluenceBboxTuple;
  attribution: string;
}

export interface OfflineMapPackMeta {
  packId: OfflineMapPackId;
  version: string;
  /** URL absoluta o relativa usada como clave en Cache API. */
  resourceUrl: string;
  byteLength: number;
  downloadedAt: string;
  attribution: string;
}

export type OfflineMapPackSyncState =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'error';
