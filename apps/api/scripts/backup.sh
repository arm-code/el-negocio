#!/usr/bin/env bash
# Backup de la base: un .sql.gz por día en ./backups, conserva los últimos 14.
# Uso:  ./scripts/backup.sh
# En un servidor (Coolify) indica el contenedor de Postgres y dónde guardar:
#   CONTAINER=<contenedor-postgres> BACKUP_DIR=/srv/backups/elnegocio ./scripts/backup.sh
#   (nombre: `docker ps --format '{{.Names}}' | grep postgres`)
# Cron, todos los días 3am:
#   0 3 * * * CONTAINER=<contenedor> BACKUP_DIR=/srv/backups/elnegocio /ruta/scripts/backup.sh >> /srv/backups/elnegocio/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

KEEP_DAYS="${KEEP_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/elnegocio-$(date +%Y%m%d-%H%M%S).sql.gz"

if [ -n "${CONTAINER:-}" ]; then
  docker exec "$CONTAINER" pg_dump -U elnegocio -d elnegocio --no-owner --no-acl | gzip > "$FILE"
else
  docker compose exec -T postgres pg_dump -U elnegocio -d elnegocio --no-owner --no-acl | gzip > "$FILE"
fi

# Un backup vacío significa que algo falló: no lo conserves
if [ "$(gzip -dc "$FILE" | wc -c)" -lt 1000 ]; then
  rm -f "$FILE"; echo "ERROR: backup vacío, descartado" >&2; exit 1
fi

find "$BACKUP_DIR" -name 'elnegocio-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "OK $FILE ($(du -h "$FILE" | cut -f1))"
