#!/usr/bin/env sh
# Archivo tar.gz del volumen de subidas del backend (/app/uploads).
# Requiere que el servicio `backend` esté en ejecución (docker compose up).
#
# Uso: sh scripts/backup-uploads.sh
# Opcional: BACKUP_DIR=/ruta/absoluta sh scripts/backup-uploads.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"

stamp="$(date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/uploads-nosignal-${stamp}.tar.gz"

docker compose exec -T backend tar czf - -C /app/uploads . >"$out"

echo "backup-uploads: OK → $out"
