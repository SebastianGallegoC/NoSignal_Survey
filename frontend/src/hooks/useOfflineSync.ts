import { useEffect } from 'react';

import { purgeExpiredForms, syncPendingForms } from '../services/sync';

const ONLINE_SYNC_DEBOUNCE_MS = 1200;

/**
 * Sincroniza cola al montar, al evento `online` y al volver la pestaña visible
 * (algunos móviles no disparan `online` de forma fiable).
 * Pasar `enabled=false` cuando no haya sesión (p. ej. fuera de rutas protegidas).
 */
export const useOfflineSync = (enabled = true): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const runSync = async () => {
      await purgeExpiredForms();
      await syncPendingForms();
    };

    void runSync();

    let debounceTimer: number | null = null;
    const scheduleSync = () => {
      if (debounceTimer != null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        void runSync();
      }, ONLINE_SYNC_DEBOUNCE_MS);
    };

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
    };
  }, [enabled]);
};
