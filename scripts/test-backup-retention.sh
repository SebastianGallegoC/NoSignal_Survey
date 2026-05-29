#!/usr/bin/env sh
# Prueba la retención de backups sin Docker (solo prune-backup-retention.sh).
# Requiere entorno tipo Unix con touch -t (Linux, macOS, Git Bash).
#
# Uso desde la raíz del repo: sh scripts/test-backup-retention.sh

set -eu

fail() {
  echo "test-backup-retention: FALLÓ — $*" >&2
  exit 1
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="${TMPDIR:-/tmp}/nosignal-backup-test-$$"
mkdir -p "$TMP"
cleanup() {
  rm -rf "$TMP"
}
trap cleanup EXIT

# Comprobar soporte de touch -t (YYYYMMDDhhmm)
if ! touch -t 202501111200 "$TMP/.probe" 2>/dev/null; then
  echo "test-backup-retention: SKIP — touch -t no disponible en este sistema"
  exit 0
fi
rm -f "$TMP/.probe"

i=1
while [ "$i" -le 7 ]; do
  d=$((10 + i))
  ts="$(printf '202501%02d1200' "$d")"
  touch -t "$ts" "$TMP/db-nosignal-${i}.sql.gz"
  touch -t "$ts" "$TMP/uploads-nosignal-${i}.tar.gz"
  i=$((i + 1))
done

KEEP=5 BACKUP_DIR="$TMP" BACKUP_RETENTION_VERBOSE=0 sh "$ROOT/scripts/prune-backup-retention.sh"

db_count=0
for f in "$TMP"/db-nosignal-*.sql.gz; do
  [ -f "$f" ] && db_count=$((db_count + 1))
done
up_count=0
for f in "$TMP"/uploads-nosignal-*.tar.gz; do
  [ -f "$f" ] && up_count=$((up_count + 1))
done

[ "$db_count" = "5" ] || fail "se esperaban 5 dumps BD, hay $db_count"
[ "$up_count" = "5" ] || fail "se esperaban 5 tar uploads, hay $up_count"

[ ! -f "$TMP/db-nosignal-1.sql.gz" ] || fail "el backup BD más viejo debería borrarse"
[ ! -f "$TMP/db-nosignal-2.sql.gz" ] || fail "el 2.º backup BD más viejo debería borrarse"
[ -f "$TMP/db-nosignal-7.sql.gz" ] || fail "el backup BD más nuevo debería conservarse"

[ ! -f "$TMP/uploads-nosignal-1.tar.gz" ] || fail "el tar uploads más viejo debería borrarse"
[ -f "$TMP/uploads-nosignal-7.tar.gz" ] || fail "el tar uploads más nuevo debería conservarse"

# Directorio vacío no debe fallar
EMPTY="$TMP/empty"
mkdir -p "$EMPTY"
KEEP=5 BACKUP_DIR="$EMPTY" sh "$ROOT/scripts/prune-backup-retention.sh" || fail "prune en directorio vacío"

# Sintaxis shell de scripts de backup
for s in backup-nosignal backup-uploads backup-automatic restore-db prune-backup-retention; do
  sh -n "$ROOT/scripts/${s}.sh" || fail "error de sintaxis en ${s}.sh"
done

echo "test-backup-retention: OK"
