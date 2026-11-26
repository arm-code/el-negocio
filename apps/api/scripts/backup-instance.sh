#!/usr/bin/env bash
# Respaldo (base y archivos subidos) de una instancia de El Negocio OS en Coolify.
#
# Uso:  backup-instance.sh <id-del-recurso> [disco]
#   id-del-recurso  parte común del nombre de sus contenedores; también aparece en
#                   la dirección del recurso en Coolify.
#   disco           punto de montaje del disco de respaldos, p. ej. /mnt/respaldos.
#                   Si se indica y no está montado, falla en vez de escribir en el
#                   disco del sistema.
#
# Guarda en <disco>/elnegocio/<id>; sin disco, en /srv/backups/elnegocio/<id>.
# BACKUP_DIR cambia la carpeta base y KEEP_DAYS los días que se conservan (14).
# Instalación, tarea nocturna y restauración: docs/DEPLOY-COOLIFY.md, sección 5.
set -euo pipefail
umask 077
APP="${1:?Uso: $0 <id-del-recurso> [disco]}"
MOUNT="${2:-}"
DIR="${BACKUP_DIR:-${MOUNT:-/srv/backups}/elnegocio}/$APP"
KEEP_DAYS="${KEEP_DAYS:-14}"

fail() { echo "$(date '+%F %T') ERROR: $*" >&2; exit 1; }

[ -z "$MOUNT" ] || mountpoint -q "$MOUNT" || fail "el disco de respaldos no está montado en $MOUNT"

# El nombre del contenedor cambia en cada despliegue; el id del recurso, no
container() { docker ps --format '{{.Names}}' | grep "^$1-$APP" | head -n 1; }
PG=$(container postgres) || fail "no encuentro el contenedor postgres de $APP"
API=$(container api) || fail "no encuentro el contenedor api de $APP"

mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
DB="$DIR/base-$STAMP.sql.gz"
FILES="$DIR/archivos-$STAMP.tgz"

# Se escribe en temporales: un respaldo a medias no debe quedar como bueno
trap 'rm -f "$DB.tmp" "$FILES.tmp"' EXIT
docker exec "$PG" pg_dump -U elnegocio -d elnegocio --no-owner --no-acl | gzip > "$DB.tmp" \
  || fail "no se pudo respaldar la base"
TABLES=$(gzip -dc "$DB.tmp" | grep -c '^COPY elnegocio\.') || fail "el respaldo de la base salió vacío"
docker exec "$API" tar czf - -C /app/storage . > "$FILES.tmp" || fail "no se pudieron respaldar los archivos"
tar -tzf "$FILES.tmp" > /dev/null || fail "el respaldo de los archivos está dañado"
mv "$DB.tmp" "$DB"
mv "$FILES.tmp" "$FILES"

# Los antiguos se borran solo después de un respaldo correcto
find "$DIR" -type f \( -name 'base-*.sql.gz' -o -name 'archivos-*.tgz' \) -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') OK: $TABLES tablas en $DB y archivos en $FILES"
