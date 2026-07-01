#!/usr/bin/env bash
# Genera cens-influencia.pmtiles para mapas offline PERCENS (AOI CENS).
# Requisitos: Docker.
# Uso: ./maps/build-cens-pack.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$REPO_ROOT/maps-build"
PUBLIC_MAPS="$REPO_ROOT/frontend/public/maps"
MANIFEST_PATH="$PUBLIC_MAPS/cens-influencia.manifest.json"

COLOMBIA_URL="https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
COLOMBIA_PBF="$WORK_DIR/colombia-latest.osm.pbf"
OUTPUT_PMTILES="$WORK_DIR/cens-influencia.pmtiles"
FINAL_PMTILES="$PUBLIC_MAPS/cens-influencia.pmtiles"
BBOX="-74.05,6.75,-72.0,9.35"

mkdir -p "$WORK_DIR" "$PUBLIC_MAPS"

echo "==> Descargando imagenes Docker..."
docker pull ghcr.io/onthegomap/planetiler:latest
docker pull iboates/osmium:latest

if [[ ! -f "$COLOMBIA_PBF" ]]; then
  echo "==> Descargando colombia-latest.osm.pbf (~300 MB)..."
  curl -fL --retry 3 --retry-delay 5 -o "$COLOMBIA_PBF" "$COLOMBIA_URL"
else
  echo "==> Reutilizando $COLOMBIA_PBF"
fi

echo "==> Recortando AOI CENS..."
docker run --rm \
  -v "$WORK_DIR:/data" \
  iboates/osmium:latest \
  extract -b "$BBOX" /data/colombia-latest.osm.pbf -o /data/cens-aoi.osm.pbf --overwrite

echo "==> Generando PMTiles..."
docker run --rm \
  -e "JAVA_TOOL_OPTIONS=-Xmx6g" \
  -w /data \
  -v "$WORK_DIR:/data" \
  ghcr.io/onthegomap/planetiler:latest \
  --download \
  --osm-path=cens-aoi.osm.pbf \
  --output=cens-influencia.pmtiles \
  --bounds="$BBOX" \
  --minzoom=10 \
  --maxzoom=16 \
  --force

cp -f "$OUTPUT_PMTILES" "$FINAL_PMTILES"
BYTE_LENGTH=$(stat -c%s "$FINAL_PMTILES" 2>/dev/null || stat -f%z "$FINAL_PMTILES")
echo "==> Pack generado: $FINAL_PMTILES ($BYTE_LENGTH bytes)"

if command -v node >/dev/null 2>&1; then
  node -e "
    const fs = require('fs');
    const p = process.argv[1];
    const n = Number(process.argv[2]);
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    m.byteLength = n;
    const parts = String(m.version).split('.');
    if (parts.length >= 3) parts[2] = String(Number(parts[2]) + 1);
    m.version = parts.join('.');
    fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
    console.log('Manifiesto:', m.version, n);
  " "$MANIFEST_PATH" "$BYTE_LENGTH"
fi

echo "Listo."
