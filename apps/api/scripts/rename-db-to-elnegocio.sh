#!/usr/bin/env bash
# Convierte UNA sola vez una base creada con los nombres antiguos (base y usuario
# `changarro`, schema `armsolutions`) a `elnegocio`. Las bases nuevas no lo necesitan.
#
#   1. Haz un respaldo.
#   2. Detén el API (Postgres sigue encendido):   docker stop <contenedor-api>
#   3. CONTAINER=<contenedor-postgres> ./scripts/rename-db-to-elnegocio.sh
#   4. Despliega la versión nueva.
#
# La contraseña se conserva. Para cambiarla a la vez: NEW_PASSWORD='...'
set -euo pipefail
: "${CONTAINER:?Uso: CONTAINER=<contenedor-postgres> $0}"

OLD=changarro
NEW=elnegocio
TMP=rename_tmp

# Dentro del contenedor, las conexiones locales de la imagen oficial no piden contraseña
run() { docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -qtA "$@"; }

if run -U "$NEW" -d "$NEW" -c "select 1" >/dev/null 2>&1; then
  echo "La base ya se llama $NEW."
else
  OTHERS=$(run -U "$OLD" -d postgres -c "select count(*) from pg_stat_activity where datname = '$OLD'")
  [ "$OTHERS" = "0" ] || { echo "Hay $OTHERS conexiones a la base '$OLD'. Detén el API y repite." >&2; exit 1; }

  # Postgres no permite renombrar el usuario con el que estás conectado: se usa uno temporal
  run -U "$OLD" -d postgres -c "CREATE ROLE $TMP SUPERUSER LOGIN"
  run -U "$TMP" -d postgres -c "ALTER DATABASE $OLD RENAME TO $NEW"
  run -U "$TMP" -d postgres -c "ALTER ROLE $OLD RENAME TO $NEW"
fi

run -U "$NEW" -d "$NEW" -c "DROP ROLE IF EXISTS $TMP"

if [ -n "$(run -U "$NEW" -d "$NEW" -c "select to_regnamespace('armsolutions')")" ]; then
  # Falla si ya existiera un schema elnegocio: revisa a mano antes de continuar
  run -U "$NEW" -d "$NEW" -c "ALTER SCHEMA armsolutions RENAME TO $NEW"
fi

if [ -n "${NEW_PASSWORD:-}" ]; then
  # Por la entrada estándar (printf es interno de bash): no aparece en la lista de procesos
  QUOTED=${NEW_PASSWORD//\'/\'\'}
  printf "ALTER ROLE %s PASSWORD '%s';\n" "$NEW" "$QUOTED" | run -U "$NEW" -d "$NEW"
fi

echo "OK: base, usuario y schema se llaman $NEW."
