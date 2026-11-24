#!/usr/bin/env bash
# Restaura un respaldo (.sql o .sql.gz) hecho con scripts/backup.sh sobre una
# base YA migrada (p. ej. la primera vez que despliegas en Coolify).
#
# ⚠ REEMPLAZA los datos: borra los schemas `armsolutions` y `auth` y los carga
# desde el respaldo. Pide confirmación escribiendo el nombre de la base.
#
# Uso (local, con docker compose):
#   ./scripts/restore-backup.sh backups/changarro-XXXX.sql.gz
# Uso (servidor / Coolify): indica el contenedor de Postgres
#   CONTAINER=<nombre-del-contenedor-postgres> ./scripts/restore-backup.sh respaldo.sql.gz
#   (nombre: `docker ps --format '{{.Names}}' | grep postgres`)
#
# Después reinicia el API.
set -euo pipefail
FILE="${1:?Uso: $0 <respaldo.sql|respaldo.sql.gz>}"
[ -s "$FILE" ] || { echo "No existe o está vacío: $FILE" >&2; exit 1; }
DB="${DB_NAME:-changarro}"; USER_="${DB_USER:-changarro}"

if [ -n "${CONTAINER:-}" ]; then PSQL=(docker exec -i "$CONTAINER" psql -U "$USER_" -d "$DB" -v ON_ERROR_STOP=1)
else cd "$(dirname "$0")/.."; PSQL=(docker compose exec -T postgres psql -U "$USER_" -d "$DB" -v ON_ERROR_STOP=1); fi

echo "Se BORRARÁN y reemplazarán los datos de la base '$DB' con '$FILE'."
read -r -p "Escribe el nombre de la base para confirmar: " ANSWER
[ "$ANSWER" = "$DB" ] || { echo "Cancelado."; exit 1; }

"${PSQL[@]}" -q -c "DROP SCHEMA IF EXISTS armsolutions CASCADE; DROP SCHEMA IF EXISTS auth CASCADE;"
if [[ "$FILE" == *.gz ]]; then gzip -dc "$FILE"; else cat "$FILE"; fi | "${PSQL[@]}" -q
echo "OK: restaurado. Reinicia el API."
