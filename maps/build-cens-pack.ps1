# Genera cens-influencia.pmtiles para mapas offline PERCENS (AOI CENS).
# Requisitos: Docker Desktop en ejecución.
# Uso: .\maps\build-cens-pack.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$WorkDir = Join-Path $RepoRoot "maps-build"
$PublicMaps = Join-Path $RepoRoot "frontend\public\maps"
$ManifestPath = Join-Path $PublicMaps "cens-influencia.manifest.json"

$ColombiaUrl = "https://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
$ColombiaPbf = Join-Path $WorkDir "colombia-latest.osm.pbf"
$AoiPbf = Join-Path $WorkDir "cens-aoi.osm.pbf"
$OutputPmtiles = Join-Path $WorkDir "cens-influencia.pmtiles"
$FinalPmtiles = Join-Path $PublicMaps "cens-influencia.pmtiles"

# Bbox CENS — debe coincidir con censInfluenceArea.ts / manifiesto.
$Bbox = "-74.05,6.75,-72.0,9.35"

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
New-Item -ItemType Directory -Force -Path $PublicMaps | Out-Null

Write-Host "==> Descargando imagenes Docker (planetiler, osmium)..."
docker pull ghcr.io/onthegomap/planetiler:latest | Out-Host
docker pull iboates/osmium:latest | Out-Host

if (-not (Test-Path $ColombiaPbf)) {
  Write-Host "==> Descargando colombia-latest.osm.pbf (~300 MB). Puede tardar varios minutos..."
  curl.exe -fL --retry 3 --retry-delay 5 -o $ColombiaPbf $ColombiaUrl
} else {
  Write-Host "==> Reutilizando $ColombiaPbf"
}

Write-Host "==> Recortando AOI CENS con osmium..."
docker run --rm `
  -v "${WorkDir}:/data" `
  iboates/osmium:latest `
  extract -b $Bbox /data/colombia-latest.osm.pbf -o /data/cens-aoi.osm.pbf --overwrite

Write-Host "==> Generando PMTiles con Planetiler (10-60 min segun CPU)..."
docker run --rm `
  -e "JAVA_TOOL_OPTIONS=-Xmx6g" `
  -w /data `
  -v "${WorkDir}:/data" `
  ghcr.io/onthegomap/planetiler:latest `
  --download `
  --osm-path=cens-aoi.osm.pbf `
  --output=cens-influencia.pmtiles `
  --bounds=$Bbox `
  --minzoom=10 `
  --maxzoom=16 `
  --force

if (-not (Test-Path $OutputPmtiles)) {
  throw "No se genero $OutputPmtiles"
}

Copy-Item -Force $OutputPmtiles $FinalPmtiles
$byteLength = (Get-Item $FinalPmtiles).Length
Write-Host "==> Pack generado: $FinalPmtiles ($byteLength bytes)"

if (Test-Path $ManifestPath) {
  node -e @"
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
"@ $ManifestPath $byteLength
}

Write-Host "Listo. Despliega el frontend para publicar el pack en percens.site/maps/"
