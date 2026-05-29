#!/usr/bin/env sh
# Dump comprimido de la base PostgreSQL (servicio `db` en docker-compose.yml).
# Ejecutar desde la raíz del repo (donde están docker-compose.yml y .env).
#
# Uso: sh scripts/backup-nosignal.sh
# Opcional: BACKUP_DIR=/ruta/absoluta sh scripts/backup-nosignal.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"

if [ ! -f "$ROOT/.env" ]; then
  echo "backup-nosignal: falta $ROOT/.env (copiá desde .env.example)" >&2
  exit 1
fi

# Cargar POSTGRES_PASSWORD y demás variables del despliegue
set -a
# shellcheck disable=SC1090
. "$ROOT/.env"
set +a

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "backup-nosignal: POSTGRES_PASSWORD vacío en .env" >&2
  exit 1
fi

stamp="$(date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/db-nosignal-${stamp}.sql.gz"

docker compose exec -T -e "PGPASSWORD=${POSTGRES_PASSWORD}" db \
  pg_dump -U nosignal -d nosignal \
    --no-owner --no-acl \
    --clean --if-exists \
  | gzip >"$out"

echo "backup-nosignal: OK → $out"
