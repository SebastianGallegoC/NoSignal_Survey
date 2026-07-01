import { useEffect } from 'react';

import { syncCensOfflineMapPackInBackground } from '@/services/offlineMapPack';

const BACKGROUND_MAP_SYNC_DEBOUNCE_MS = 2_000;

/**
 * Descarga en segundo plano el pack cartográfico CENS (área de influencia).
 * Sin UI: no interrumpe al usuario. Se reintenta al volver online o la pestaña visible.
 */
export const useCensOfflineMapSync = (enabled = true): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let debounceTimer: number | null = null;
    let abortController: AbortController | null = null;

    const runSync = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      abortController?.abort();
      abortController = new AbortController();
      void syncCensOfflineMapPackInBackground(abortController.signal).catch(
        () => {
          // Descarga silenciosa: fallos se reintentan en el próximo ciclo.
        },
      );
    };

    const scheduleSync = () => {
      if (debounceTimer != null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        runSync();
      }, BACKGROUND_MAP_SYNC_DEBOUNCE_MS);
    };

    scheduleSync();

    const handleOnline = () => scheduleSync();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        scheduleSync();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer != null) {
        window.clearTimeout(debounceTimer);
      }
      abortController?.abort();
    };
  }, [enabled]);
};
