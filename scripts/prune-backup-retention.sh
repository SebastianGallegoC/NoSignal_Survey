#!/usr/bin/env sh
# Elimina backups antiguos en BACKUP_DIR dejando como máximo KEEP archivos por tipo
# (db-nosignal-*.sql.gz y uploads-nosignal-*.tar.gz), por fecha de modificación (ls -t).
#
# Uso: KEEP=5 BACKUP_DIR=/ruta/absoluta sh scripts/prune-backup-retention.sh
# Opcional: BACKUP_RETENTION_VERBOSE=1 para registrar cada archivo borrado.

set -eu

BACKUP_DIR="${BACKUP_DIR:?prune-backup-retention: falta BACKUP_DIR}"
KEEP_RAW="${KEEP:-5}"

case "$KEEP_RAW" in
  '' | *[!0-9]*) KEEP_RAW=5 ;;
esac
KEEP="$KEEP_RAW"
if [ "$KEEP" -lt 1 ]; then
  KEEP=5
fi

VERBOSE="${BACKUP_RETENTION_VERBOSE:-0}"

(
  cd "$BACKUP_DIR" || exit 0
  # shellcheck disable=SC2012
  ls -t db-nosignal-*.sql.gz 2>/dev/null |
    awk -v k="$KEEP" 'NR > k { print $0 }' |
    while read -r file; do
      [ -z "$file" ] && continue
      if [ "$VERBOSE" = "1" ]; then
        echo "prune-backup-retention: eliminando (BD): $file" >&2
      fi
      rm -f "$file"
    done

  # shellcheck disable=SC2012
  ls -t uploads-nosignal-*.tar.gz 2>/dev/null |
    awk -v k="$KEEP" 'NR > k { print $0 }' |
    while read -r file; do
      [ -z "$file" ] && continue
      if [ "$VERBOSE" = "1" ]; then
        echo "prune-backup-retention: eliminando (uploads): $file" >&2
      fi
      rm -f "$file"
    done
)
