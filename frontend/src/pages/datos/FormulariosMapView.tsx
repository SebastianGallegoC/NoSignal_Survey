import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import { municipioFilterLabel } from "@/constants/formStatsMunicipio";
import type { FormMapPointItem } from "@/services/api";
import { spreadMapPoints } from "@/pages/datos/mapPointSpread";

interface FormulariosMapViewProps {
  points: FormMapPointItem[];
  total: number;
  loadState:
    | "idle"
    | "loading"
    | "ready"
    | "error"
    | "offline"
    | "needs_municipios"
    | "no_session";
  error: string | null;
  onRetry: () => void;
}

function markerColor(resultado: string): string {
  if (resultado === "CUMPLE") {
    return "#16a34a";
  }
  if (resultado === "NO CUMPLE") {
    return "#dc2626";
  }
  return "#64748b";
}

function createMarkerIcon(resultado: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:${markerColor(
      resultado,
    )};border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,0.22);"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function createPopupContent(point: FormMapPointItem): HTMLElement {
  const container = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = point.nombres_apellidos_encuestado || "Sin nombre registrado";
  container.appendChild(title);

  const municipio = document.createElement("div");
  municipio.textContent = `Municipio: ${municipioFilterLabel(point.municipio)}`;
  container.appendChild(municipio);

  const fecha = document.createElement("div");
  fecha.textContent = `Fecha visita: ${point.fecha_visita || "Sin fecha"}`;
  container.appendChild(fecha);

  const resultado = document.createElement("div");
  resultado.textContent = `Resultado: ${point.resultado_validacion || "Sin resultado"}`;
  container.appendChild(resultado);

  return container;
}

function MapMarkers({ points }: { points: FormMapPointItem[] }) {
  const map = useMap();
  const displayPoints = useMemo(() => spreadMapPoints(points), [points]);

  useEffect(() => {
    const layerGroup = L.layerGroup();

    for (const point of displayPoints) {
      const marker = L.marker([point.displayLat, point.displayLng], {
        icon: createMarkerIcon(point.resultado_validacion),
      });
      marker.bindPopup(createPopupContent(point));
      layerGroup.addLayer(marker);
    }

    map.addLayer(layerGroup);
    return () => {
      map.removeLayer(layerGroup);
    };
  }, [displayPoints, map]);

  return null;
}

function MapFitBounds({ points }: { points: FormMapPointItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }
    if (points.length === 1) {
      const one = points[0];
      map.setView([one.latitud, one.longitud], 14);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitud, point.longitud]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
  }, [map, points]);

  return null;
}

export const FormulariosMapView = ({
  points,
  total,
  loadState,
  error,
  onRetry,
}: FormulariosMapViewProps) => {
  if (loadState === "offline") {
    return <p className="py-6 text-center text-sm text-slate-500">Conectate a internet para ver este mapa.</p>;
  }
  if (loadState === "no_session") {
    return <p className="py-6 text-center text-sm text-slate-500">Iniciá sesión para ver el mapa del servidor.</p>;
  }
  if (loadState === "needs_municipios") {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Seleccioná al menos un municipio para visualizar puntos.
      </p>
    );
  }
  if (loadState === "loading") {
    return <p className="py-8 text-center text-sm text-slate-600">Cargando mapa…</p>;
  }
  if (loadState === "idle") {
    return <p className="py-8 text-center text-sm text-slate-600">Cargando mapa…</p>;
  }
  if (loadState === "error") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
        No se pudieron cargar los puntos del mapa: {error ?? "error desconocido"}.
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 font-medium underline"
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
        No hay formularios con coordenadas válidas para los filtros seleccionados.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">
        Mostrando {total} formularios con coordenadas válidas.
      </p>
      <div className="h-[320px] overflow-hidden rounded-xl border border-slate-200 sm:h-[420px]">
        <MapContainer
          center={[4.570868, -74.297333]}
          zoom={6}
          className="h-full w-full"
          preferCanvas
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapMarkers points={points} />
          <MapFitBounds points={points} />
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Colores: verde (cumple), rojo (no cumple), gris (sin resultado). Puntos en la misma
        ubicación se muestran ligeramente separados para facilitar la selección.
      </p>
    </div>
  );
};
