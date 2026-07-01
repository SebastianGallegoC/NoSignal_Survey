import { lazy, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { useConnectivityStatus } from "@/hooks/useConnectivityStatus";

const LocationPreviewMap = lazy(async () => {
  const mod = await import("@/components/map/LocationPreviewMap");
  return { default: mod.LocationPreviewMap };
});

type GpsPoint = {
  latitud: number;
  longitud: number;
  precision: number;
};

type Props = {
  estado: "idle" | "buscando" | "ok" | "error";
  progreso: string | null;
  gps: GpsPoint | null;
  error: string | null;
  cargando: boolean;
  onSolicitarGps: () => void;
  modoCoordenadas: "automatico" | "manual";
  onChangeModoCoordenadas: (modo: "automatico" | "manual") => void;
  buildExternalMapUrl: (lat: number, lon: number) => string;
};

export const FormularioOverviewPanel = ({
  estado,
  progreso,
  gps,
  error,
  cargando,
  onSolicitarGps,
  modoCoordenadas,
  onChangeModoCoordenadas,
  buildExternalMapUrl,
}: Props) => {
  const isGps = modoCoordenadas === "automatico";
  const isOnline = useConnectivityStatus();

  return (
    <section className="rounded-2xl border border-teal-100 bg-white/80 p-4 shadow-[0_18px_40px_-35px_rgba(15,118,110,0.6)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Ubicación
        </h2>
        <p className="text-xs text-slate-500">
          Elige si usas el GPS del dispositivo o coordenadas manuales.
        </p>
      </div>

      <div
        className="mt-4 flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        role="group"
        aria-label="Modo de coordenadas"
      >
        <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50/90 p-1 lg:w-auto lg:min-w-[320px]">
          <button
            type="button"
            aria-pressed={isGps}
            onClick={() => onChangeModoCoordenadas("automatico")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:flex-none lg:min-w-[150px] ${
              isGps
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white/80"
            }`}
          >
            GPS
          </button>
          <button
            type="button"
            aria-pressed={!isGps}
            onClick={() => onChangeModoCoordenadas("manual")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:flex-none lg:min-w-[150px] ${
              !isGps
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white/80"
            }`}
          >
            Manual
          </button>
        </div>

        {isGps ? (
          <Button
            type="button"
            onClick={onSolicitarGps}
            disabled={cargando}
            className="w-full shrink-0 bg-teal-600 text-white hover:bg-teal-700 lg:w-auto"
          >
            {cargando ? "Buscando GPS…" : "Tomar ubicación"}
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-sm font-medium text-slate-700">
        Estado:{" "}
        {isGps
          ? estado === "buscando"
            ? "Tomando ubicación..."
            : estado === "ok"
              ? "Ubicación capturada"
              : estado === "error"
                ? "Error de GPS"
                : "Sin lectura"
          : "Coordenadas manuales"}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {isGps
          ? estado === "buscando"
            ? (progreso ?? "Buscando señal GPS...")
            : gps
              ? `OK · precisión ${gps.precision.toFixed(1)} m`
              : error
                ? `Error: ${error}`
                : "Sin ubicación registrada"
          : "Agregue las coordenadas en los campos del formulario."}
      </p>

      {gps ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-teal-100 bg-slate-50">
          <div className="h-48 overflow-hidden sm:h-56">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Cargando mapa…
                </div>
              }
            >
              <LocationPreviewMap gps={gps} className="h-48 sm:h-56" />
            </Suspense>
          </div>
          <div className="px-3 py-2 text-xs text-slate-700">
            Lat: {gps.latitud.toFixed(6)} · Lon: {gps.longitud.toFixed(6)} ·
            Precisión: {gps.precision.toFixed(1)} m
          </div>
          <a
            className={`block px-3 pb-3 text-xs font-medium ${isOnline ? "text-teal-800 underline" : "text-slate-400"}`}
            href={
              isOnline
                ? buildExternalMapUrl(gps.latitud, gps.longitud)
                : undefined
            }
            target="_blank"
            rel="noreferrer"
            aria-disabled={!isOnline}
            onClick={(e) => {
              if (!isOnline) e.preventDefault();
            }}
          >
            {isOnline
              ? "Abrir ubicación en OpenStreetMap"
              : "Abrir ubicación (requiere conexión)"}
          </a>
        </div>
      ) : null}
    </section>
  );
};
