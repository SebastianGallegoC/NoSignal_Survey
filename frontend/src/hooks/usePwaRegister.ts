import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef } from "react";

const DEFAULT_UPDATE_CHECK_MS = 60_000;

export const usePwaRegister = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const isUpdatingRef = useRef(false);

  const safeUpdate = (registration: ServiceWorkerRegistration | null) => {
    if (!registration || isUpdatingRef.current) {
      return;
    }

    // Verifica estado de conectividad antes de intentar actualizar.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    isUpdatingRef.current = true;
    void registration.update().catch((error) => {
      // Offline o fallo de fetch del sw.js: no lo tratamos como error fatal.
      // Solo log en debug para no saturar la consola en modo offline.
      if (navigator.onLine) {
        console.debug('ServiceWorker update failed', error?.message ?? error);
      }
    }).finally(() => {
      isUpdatingRef.current = false;
    });
  };

  const sw = useRegisterSW({
    onRegisteredSW: (_swUrl, registration) => {
      registrationRef.current = registration ?? null;
      // Al abrir la app, pedir de inmediato si hay SW nuevo (crítico para cold-start).
      if (typeof navigator === 'undefined' || navigator.onLine) {
        safeUpdate(registration ?? null);
      }
    },
  });

  useEffect(() => {
    const triggerUpdate = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      safeUpdate(registrationRef.current);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        triggerUpdate();
      }
    };

    const onOnline = () => {
      // Reinicia intentos cuando se recupera conexión.
      isUpdatingRef.current = false;
      triggerUpdate();
    };

    const onOffline = () => {
      // Cancela intentos cuando se pierde conexión.
      isUpdatingRef.current = false;
    };

    triggerUpdate();
    const bootDelays = [250, 1500, 4000].map((ms) =>
      window.setTimeout(triggerUpdate, ms),
    );

    const timer = window.setInterval(triggerUpdate, DEFAULT_UPDATE_CHECK_MS);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const id of bootDelays) {
        window.clearTimeout(id);
      }
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return sw;
};
