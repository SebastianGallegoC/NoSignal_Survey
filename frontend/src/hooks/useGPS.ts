import { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_GPS_ACCURACY_METERS } from '@/constants/gpsConfig';

export interface GPSState {
  latitud: number;
  longitud: number;
  precision: number;
}

export type UseGPSOptions = {
  /** Ubicación ya capturada restaurada desde borrador local (sin nuevo watchPosition). */
  restoredPosition?: GPSState | null;
};

interface GPSHookState {
  gps: GPSState | null;
  cargando: boolean;
  error: string | null;
  estado: 'idle' | 'buscando' | 'ok' | 'error';
  progreso: string | null;
  solicitarGPS: () => void;
  /** Detiene el seguimiento y deja el hook como al cargar la página (sin ubicación). */
  limpiarUbicacion: () => void;
}

const GPS_TIMEOUT_MS = 60000;

type PermissionStateLike = 'granted' | 'denied' | 'prompt' | 'unknown';

const getBrowserPermissionHelp = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('edg/')) {
    return 'En Edge: clic en el candado de la URL -> Permisos para este sitio -> Ubicación: Permitir; luego recarga la página.';
  }
  if (ua.includes('chrome/')) {
    return 'En Chrome: clic en el candado de la URL -> Configuración del sitio -> Ubicación: Permitir; luego recarga la página.';
  }
  if (ua.includes('firefox/')) {
    return 'En Firefox: clic en el candado de la URL -> Borrar/Bloquear permisos del sitio y volver a permitir ubicación; luego recarga.';
  }
  if (ua.includes('safari/')) {
    return 'En Safari: Safari > Configuración > Sitios web > Ubicación > Permitir para este sitio; luego recarga la página.';
  }
  return 'Habilitá el permiso de ubicación en el navegador para este sitio y recargá la página.';
};

const getGeoErrorMessage = (
  err: GeolocationPositionError,
  permissionState: PermissionStateLike,
): string => {
  if (err.code === err.PERMISSION_DENIED) {
    return permissionState === 'denied'
      ? `No se pudo obtener la ubicación porque el permiso está bloqueado. ${getBrowserPermissionHelp()}`
      : 'No diste permiso de ubicación. Aceptá el permiso del navegador para continuar.';
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'No se pudo obtener la ubicación: señal GPS no disponible. Probá en una zona abierta o activá la ubicación del dispositivo.';
  }
  if (err.code === err.TIMEOUT) {
    return 'Se agotó el tiempo para obtener la ubicación. Verificá señal GPS e intentá nuevamente.';
  }
  return err.message?.trim() || 'No se pudo obtener la ubicación.';
};

export const useGPS = (opts?: UseGPSOptions): GPSHookState => {
  const initial = opts?.restoredPosition ?? null;
  const [gps, setGps] = useState<GPSState | null>(() => initial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<'idle' | 'buscando' | 'ok' | 'error'>(() => (initial ? 'ok' : 'idle'));
  const [progreso, setProgreso] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const limpiarUbicacion = useCallback(() => {
    stopTracking();
    setGps(null);
    setCargando(false);
    setError(null);
    setEstado('idle');
    setProgreso(null);
  }, [stopTracking]);

  const solicitarGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('GPS no disponible en este dispositivo.');
      setEstado('error');
      return;
    }

    stopTracking();
    setCargando(true);
    setError(null);
    setProgreso('Iniciando GPS de alta precisión...');
    setEstado('buscando');
    setGps(null);

    let bestPosition: GPSState | null = null;
    let permissionState: PermissionStateLike = 'unknown';

    // Consulta no bloqueante del estado de permiso para mejorar el mensaje de error.
    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
      void navigator.permissions
        .query({ name: 'geolocation' })
        .then((p) => {
          permissionState = p.state;
        })
        .catch(() => {
          permissionState = 'unknown';
        });
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const precision = pos.coords.accuracy;
        const currentPosition = {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision,
        };

        if (!bestPosition || precision < bestPosition.precision) {
          bestPosition = currentPosition;
          setProgreso(`Buscando precisión ≤ ${MAX_GPS_ACCURACY_METERS}m. Mejor lectura: ${precision.toFixed(1)}m.`);
        }

        if (precision <= MAX_GPS_ACCURACY_METERS) {
          setGps(currentPosition);
          setError(null);
          setProgreso(`Ubicación obtenida con ${precision.toFixed(1)}m de precisión.`);
          setEstado('ok');
          setCargando(false);
          stopTracking();
        }
      },
      (geoError) => {
        setError(getGeoErrorMessage(geoError, permissionState));
        setProgreso(null);
        setEstado('error');
        setCargando(false);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );

    timeoutRef.current = window.setTimeout(() => {
      const bestAccuracy = bestPosition?.precision.toFixed(1);
      setError(
        bestAccuracy
          ? `Precisión insuficiente. Mejor lectura: ${bestAccuracy}m. Muévete a zona abierta e intenta nuevamente.`
          : 'No se logró obtener una lectura GPS suficientemente precisa.',
      );
      setProgreso(null);
      setEstado('error');
      setGps(null);
      setCargando(false);
      stopTracking();
    }, GPS_TIMEOUT_MS);
  }, [stopTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { gps, cargando, error, estado, progreso, solicitarGPS, limpiarUbicacion };
};
