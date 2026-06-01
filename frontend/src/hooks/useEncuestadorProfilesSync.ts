import { useEffect } from 'react';

import { syncEnabledEncuestadorProfiles } from '@/services/encuestadorProfiles';

const ONLINE_SYNC_DEBOUNCE_MS = 1200;

/**
 * Descarga y persiste en IndexedDB el catálogo lite de perfiles habilitados
 * (id + nombre) al montar rutas protegidas, al evento `online` y al volver visible la pestaña.
 */
export const useEncuestadorProfilesSync = (
  enabled: boolean,
  username: string | null,
): void => {
  useEffect(() => {
    if (!enabled || !username?.trim()) {
      return;
    }

    const user = username.trim();

    const runSync = async () => {
      if (!navigator.onLine) {
        return;
      }
      try {
        await syncEnabledEncuestadorProfiles(user);
      } catch {
        // Mantener la última copia local si falla la red o la API.
      }
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
  }, [enabled, username]);
};
