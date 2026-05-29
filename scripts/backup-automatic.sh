#!/usr/bin/env sh
# Ejecuta backup de BD + uploads y deja como máximo BACKUP_KEEP_LAST archivos de cada tipo
# (los más antiguos se borran según fecha de modificación).
#
# Pensado para cron semanal; ejemplo domingo 12:00 — ver scripts/README-backups.md
#
# Uso: sh scripts/backup-automatic.sh
# Opcional: BACKUP_KEEP_LAST=5 BACKUP_DIR=/var/backups/nosignal sh scripts/backup-automatic.sh

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEEP_RAW="${BACKUP_KEEP_LAST:-5}"

case "$KEEP_RAW" in
  '' | *[!0-9]*) KEEP_RAW=5 ;;
esac
KEEP="$KEEP_RAW"
if [ "$KEEP" -lt 1 ]; then
  KEEP=5
fi

mkdir -p "$BACKUP_DIR"

echo "$(date -Is 2>/dev/null || date) backup-automatic: inicio (KEEP_LAST=$KEEP)"

sh "$ROOT/scripts/backup-nosignal.sh"
sh "$ROOT/scripts/backup-uploads.sh"

echo "$(date -Is 2>/dev/null || date) backup-automatic: rotación (máximo $KEEP por tipo)"

BACKUP_RETENTION_VERBOSE=1 KEEP="$KEEP" BACKUP_DIR="$BACKUP_DIR" sh "$ROOT/scripts/prune-backup-retention.sh"

echo "$(date -Is 2>/dev/null || date) backup-automatic: fin"
