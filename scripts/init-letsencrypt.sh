#!/usr/bin/env sh
# Crea letsencrypt/acme.json vacío con permisos 600 (Linux/macOS).
# Ejecutar desde la raíz del repo: sh scripts/init-letsencrypt.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ACME="$ROOT/letsencrypt/acme.json"

mkdir -p "$ROOT/letsencrypt"
if [ ! -f "$ACME" ]; then
  umask 077
  : >"$ACME"
  chmod 600 "$ACME"
  echo "Creado $ACME (permisos 600)"
else
  echo "Ya existe $ACME — no se sobrescribe"
  chmod 600 "$ACME" 2>/dev/null || true
fi
