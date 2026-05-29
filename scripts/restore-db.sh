#!/usr/bin/env sh
# Restaura un dump .sql.gz generado por backup-nosignal.sh sobre la BD `nosignal`.
# Sobrescribe objetos según el contenido del dump (--clean del pg_dump).
#
# Uso:
#   sh scripts/restore-db.sh backups/db-nosignal-YYYYMMDD-HHMM.sql.gz --confirm
#
# Sin --confirm el script sale sin hacer cambios.

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

if [ "${2:-}" != "--confirm" ]; then
  echo "restore-db: uso — sh scripts/restore-db.sh <archivo.sql.gz> --confirm" >&2
  echo "restore-db: ADVERTENCIA: destruye y recrea objetos de la BD nosignal según el dump." >&2
  exit 2
fi

dump="$1"
if [ ! -f "$dump" ]; then
  echo "restore-db: no existe el archivo: $dump" >&2
  exit 1
fi

if [ ! -f "$ROOT/.env" ]; then
  echo "restore-db: falta $ROOT/.env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ROOT/.env"
set +a

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "restore-db: POSTGRES_PASSWORD vacío en .env" >&2
  exit 1
fi

echo "restore-db: restaurando desde $dump …"

gunzip -c "$dump" | docker compose exec -T -e "PGPASSWORD=${POSTGRES_PASSWORD}" db \
  psql -v ON_ERROR_STOP=1 -U nosignal -d nosignal

echo "restore-db: terminado"
