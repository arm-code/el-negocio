# Despliegue en Coolify

Una **instancia** (un negocio) = un recurso "Docker Compose" en Coolify con
`docker-compose.yml` de la raíz: `postgres` + `migrate` + `api` + `web`.
Solo `web` se publica; el API queda en la red interna y el front reenvía `/api`
y `/files` hacia él (mismo origen: sin CORS ni cookies entre dominios).

> Los pasos de Coolify están escritos de memoria sobre su interfaz; si algún
> nombre de botón cambió, la idea es la misma. Lo que sí está probado en local es
> el stack (`docker-compose.yml`), el restore y los scripts.

## 0. Antes de empezar

- El repo `arm-code/elchangarro` en GitHub (rama `main`).
- Dominio de la instancia, p. ej. `eventosmendoza.dejuarez.mx`, apuntando al tunnel
  de Cloudflare → proxy de Coolify.
- Un respaldo reciente de tu base y los archivos subidos (ver sección 3).

## 1. Crear el recurso

1. **Project → New Resource → Docker Compose** (origen: GitHub, repo `arm-code/elchangarro`,
   rama `main`, *Base Directory* `/`, *Compose file* `/docker-compose.yml`).
2. **Variables de entorno** (ver `.env.example`):

   | Variable | Valor |
   |---|---|
   | `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
   | `JWT_SECRET` | `openssl rand -hex 48` (el mismo lo usan API y front) |
   | `BUSINESS_SLUG` | `eventosmendoza` |
   | `SITE_URL` | `https://eventosmendoza.dejuarez.mx` (sin `/` final) |
   | `DOCS_PASSWORD` | cualquier valor largo |

   `SITE_URL` se incorpora al compilar el front: si lo cambias, hay que volver a desplegar.
3. **Dominio**: en el servicio `web`, dominio `https://eventosmendoza.dejuarez.mx`, puerto **3000**.
   Los demás servicios no llevan dominio.
4. **Deploy.** La primera vez corre las migraciones sobre una base vacía y el API arranca,
   pero el sitio mostrará "no encontrado" hasta cargar los datos (sección 3).

## 2. Verificar el despliegue

- Los 4 servicios en verde (`migrate` termina y sale: es normal).
- `https://<dominio>/` responde. Con base vacía muestra error de negocio no configurado.

## 3. Cargar tus datos (solo la primera vez)

**En tu máquina**, genera el respaldo de la base actual y empaqueta los archivos:

```bash
cd apps/api
./scripts/backup.sh                       # → backups/changarro-<fecha>.sql.gz
docker run --rm -v <volumen_storage_local>:/data alpine tar czf - -C /data . > storage.tgz
```
(`docker volume ls | grep storage` te dice el nombre del volumen local.)

**Cópialos al servidor** (scp o similar) y, **en el servidor**:

```bash
# nombres reales: docker ps --format '{{.Names}}'
PG=<contenedor-postgres>;  API=<contenedor-api>

# 1) Base de datos (pide escribir "changarro" para confirmar; REEMPLAZA los datos)
CONTAINER=$PG ./apps/api/scripts/restore-backup.sh changarro-XXXX.sql.gz

# 2) Archivos subidos al volumen del API (el volumen exacto se lee del propio contenedor)
VOL=$(docker inspect $API --format '{{range .Mounts}}{{if eq .Destination "/app/storage"}}{{.Name}}{{end}}{{end}}')
docker run --rm -i -v "$VOL":/data alpine tar xzf - -C /data < storage.tgz
docker exec -u root $API chown -R appuser:appgroup /app/storage
```

Después **Redeploy** en Coolify: la migración `NormalizeFileUrls` convierte las URLs de
imágenes a rutas relativas (`/files/...`) y el API arranca con tus datos.

## 4. Usuarios

Los usuarios y sus contraseñas ya vienen en el respaldo. Para crear o cambiar uno
(no hay registro público), dentro del contenedor del API:

```bash
docker exec -it $API node dist/src/scripts/user-admin.js list
docker exec -it $API node dist/src/scripts/user-admin.js set-password correo@ejemplo.com --business eventosmendoza
```

## 5. Backups (hazlo desde el primer día)

Cron en el servidor, todos los días a las 3am (ajusta rutas y contenedor):

```
0 3 * * * CONTAINER=<contenedor-postgres> BACKUP_DIR=/srv/backups/changarro /ruta/al/repo/apps/api/scripts/backup.sh >> /srv/backups/changarro/backup.log 2>&1
```

Guarda además una copia fuera del servidor (otro disco, tu PC). Los archivos subidos
(`storage`) cambian poco: respáldalos con el `tar` de la sección 3. El **contenedor de
Postgres puede cambiar de nombre** tras un redeploy; comprueba el nombre si el cron falla.

## 6. Actualizar y volver atrás

- Actualizar: push a `main` → Redeploy (o activa el despliegue automático en Coolify).
  Las migraciones corren solas antes de arrancar el API.
- Volver atrás: redeploy del commit anterior. Si una migración ya se aplicó y hay que
  deshacerla, restaura el último respaldo (sección 3, paso 1).

## 7. Un cliente nuevo

Otro recurso en Coolify con el **mismo repo** y variables propias (`BUSINESS_SLUG`,
`SITE_URL`, secretos nuevos). Con la base vacía, crea su negocio y su usuario:

```bash
docker exec -it $API node dist/src/scripts/user-admin.js create-business "Nombre del negocio" slug-del-negocio
docker exec -it $API node dist/src/scripts/user-admin.js set-password dueno@correo.com --business slug-del-negocio
```

## 8. Si algo falla

| Síntoma | Causa probable |
|---|---|
| Login responde pero no se queda la sesión | `SITE_URL`/dominio con `http` en vez de `https` (cookie `Secure`) |
| Imágenes rotas | no se copiaron los archivos (3.2) o falta el `chown` |
| Sitio sin negocio | falta restaurar datos, o `BUSINESS_SLUG` no coincide con el de la base |
| `migrate` falla | `POSTGRES_PASSWORD` cambió después de crear el volumen: la base conserva la contraseña original |
| 502 en el dominio | el servicio `web` no está sano; revisa sus logs |
