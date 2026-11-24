# Postgres con el script de compatibilidad ya incluido. Se hornea en la imagen
# (en vez de montar un archivo del repo) para que funcione igual en cualquier
# servidor, incluido Coolify. El script solo corre al crear un volumen nuevo.
FROM postgres:17-alpine
COPY init/ /docker-entrypoint-initdb.d/
