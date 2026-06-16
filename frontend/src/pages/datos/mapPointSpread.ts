import type { FormMapPointItem } from "@/services/api";

export interface MapPointDisplay extends FormMapPointItem {
  displayLat: number;
  displayLng: number;
}

/** Agrupa coordenadas a ~1,1 m; suficiente para puntos GPS casi idénticos. */
const LOCATION_BUCKET_DECIMALS = 5;

/** Radio base (metros) del círculo de separación visual entre marcadores. */
const SPREAD_RADIUS_METERS = 14;

function locationBucketKey(latitud: number, longitud: number): string {
  return `${latitud.toFixed(LOCATION_BUCKET_DECIMALS)},${longitud.toFixed(LOCATION_BUCKET_DECIMALS)}`;
}

/**
 * Reparte marcadores que comparten ubicación (o están muy cerca) en un círculo
 * para que cada uno sea visible y clicable sin agrupación por cluster.
 */
export function spreadMapPoints(points: FormMapPointItem[]): MapPointDisplay[] {
  const groups = new Map<string, FormMapPointItem[]>();

  for (const point of points) {
    const key = locationBucketKey(point.latitud, point.longitud);
    const bucket = groups.get(key) ?? [];
    bucket.push(point);
    groups.set(key, bucket);
  }

  const spread: MapPointDisplay[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      const point = group[0];
      spread.push({
        ...point,
        displayLat: point.latitud,
        displayLng: point.longitud,
      });
      continue;
    }

    const centerLat =
      group.reduce((sum, point) => sum + point.latitud, 0) / group.length;
    const centerLng =
      group.reduce((sum, point) => sum + point.longitud, 0) / group.length;
    const radius =
      SPREAD_RADIUS_METERS * Math.max(1, Math.sqrt(group.length) * 0.7);
    const metersPerLng =
      111_320 * Math.cos((centerLat * Math.PI) / 180) || 111_320;

    group.forEach((point, index) => {
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      spread.push({
        ...point,
        displayLat: centerLat + (radius / 111_320) * Math.sin(angle),
        displayLng: centerLng + (radius / metersPerLng) * Math.cos(angle),
      });
    });
  }

  return spread;
}
