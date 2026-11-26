#!/usr/bin/env bash
# Vuelta atrás de rename-db-to-elnegocio.sh: devuelve la base y el usuario a
# `changarro` y el schema a `armsolutions`, para volver a la versión anterior.
# Solo cambia nombres: no borra ni restaura datos. Es seguro repetirlo.
#
#   1. Detén el API (Postgres sigue encendido):   docker stop <contenedor-api>
#   2. CONTAINER=<contenedor-postgres> bash revert-db-rename.sh
#   3. Enciende el API anterior (`docker start <contenedor-api>`) o, si ya no
#      existe, despliega el commit anterior.
#
# La contraseña se conserva.
set -euo pipefail
: "${CONTAINER:?Uso: CONTAINER=<contenedor-postgres> bash $0}"

CURRENT=elnegocio
PREVIOUS=changarro
PREVIOUS_SCHEMA=armsolutions
TMP=rename_tmp

# Dentro del contenedor, las conexiones locales de la imagen oficial no piden contraseña
run() { docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -qtA "$@"; }

if run -U "$PREVIOUS" -d "$PREVIOUS" -c "select 1" >/dev/null 2>&1; then
  echo "La base ya se llama $PREVIOUS."
else
  OTHERS=$(run -U "$CURRENT" -d postgres -c "select count(*) from pg_stat_activity where datname = '$CURRENT'")
  [ "$OTHERS" = "0" ] || { echo "Hay $OTHERS conexiones a la base '$CURRENT'. Detén el API y repite." >&2; exit 1; }

  # Postgres no permite renombrar el usuario con el que estás conectado: se usa uno temporal
  run -U "$CURRENT" -d postgres -c "CREATE ROLE $TMP SUPERUSER LOGIN"
  run -U "$TMP" -d postgres -c "ALTER DATABASE $CURRENT RENAME TO $PREVIOUS"
  run -U "$TMP" -d postgres -c "ALTER ROLE $CURRENT RENAME TO $PREVIOUS"
fi

run -U "$PREVIOUS" -d "$PREVIOUS" -c "DROP ROLE IF EXISTS $TMP"

if [ -n "$(run -U "$PREVIOUS" -d "$PREVIOUS" -c "select to_regnamespace('$CURRENT')")" ]; then
  # Falla si ya existiera un schema armsolutions: revisa a mano antes de continuar
  run -U "$PREVIOUS" -d "$PREVIOUS" -c "ALTER SCHEMA $CURRENT RENAME TO $PREVIOUS_SCHEMA"
fi

echo "OK: base y usuario se llaman $PREVIOUS; el schema, $PREVIOUS_SCHEMA."
