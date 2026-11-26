# Despliegue en Coolify

Una **instancia** (un negocio) = un recurso "Docker Compose" en Coolify con
`docker-compose.yml` de la raíz: `postgres` + `migrate` + `api` + `web`.
Solo `web` se publica; el API queda en la red interna y el front reenvía `/api`
y `/files` hacia él (mismo origen: sin CORS ni cookies entre dominios).

> Los pasos de Coolify están escritos de memoria sobre su interfaz; si algún
> nombre de botón cambió, la idea es la misma. Lo que sí está probado en local es
> el stack (`docker-compose.yml`), el restore y los scripts.

> **¿Vas a pasar de la máquina de pruebas a producción?** Lee primero la sección
> [9. Pasar a producción](#9-pasar-a-producción-lista-de-pasos): hay valores que cambian
> (sobre todo `IMAGE_OPTIMIZATION`) y es fácil olvidarlos.

## 0. Antes de empezar

- El repo `arm-code/el-negocio` en GitHub (rama `main`).
- Dominio de la instancia, p. ej. `mi-negocio.dejuarez.mx`, apuntando al tunnel
  de Cloudflare → proxy de Coolify.
- Un respaldo reciente de tu base y los archivos subidos (ver sección 3).

## 1. Crear el recurso

1. **Project → New Resource → Docker Compose** (origen: GitHub, repo `arm-code/el-negocio`,
   rama `main`, *Base Directory* `/`, *Compose file* `/docker-compose.yml`).
2. **Variables de entorno** (ver `.env.example`):

   | Variable | Valor |
   |---|---|
   | `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
   | `JWT_SECRET` | `openssl rand -hex 48` (el mismo lo usan API y front) |
   | `BUSINESS_SLUG` | `mi-negocio` |
   | `SITE_URL` | `https://mi-negocio.dejuarez.mx` (sin `/` final) |
   | `DOCS_PASSWORD` | cualquier valor largo |
   | `IMAGE_OPTIMIZATION` | `false` en CPUs viejos (máquina de pruebas); `true` en servidores modernos (ver sección 9) |

   `SITE_URL` e `IMAGE_OPTIMIZATION` se incorporan al compilar el front: si los cambias, hay que
   volver a desplegar (en Coolify, mantén marcada la casilla *Buildtime* de ambas).
3. **Dominio**: en el servicio `web`, dominio `https://mi-negocio.dejuarez.mx`, puerto **3000**.
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
./scripts/backup.sh                       # → backups/elnegocio-<fecha>.sql.gz
docker run --rm -v <volumen_storage_local>:/data alpine tar czf - -C /data . > storage.tgz
```
(`docker volume ls | grep storage` te dice el nombre del volumen local.)

**Cópialos al servidor** (scp o similar) y, **en el servidor**:

```bash
# nombres reales: docker ps --format '{{.Names}}'
PG=<contenedor-postgres>;  API=<contenedor-api>

# 1) Base de datos (pide escribir "elnegocio" para confirmar; REEMPLAZA los datos)
CONTAINER=$PG ./apps/api/scripts/restore-backup.sh elnegocio-XXXX.sql.gz

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
docker exec -it $API node dist/src/scripts/user-admin.js set-password correo@ejemplo.com --business mi-negocio
```

## 5. Backups (hazlo desde el primer día)

[`apps/api/scripts/backup-instance.sh`](../apps/api/scripts/backup-instance.sh) guarda la
base y los archivos subidos de una instancia. Encuentra sus contenedores por el **id
del recurso** (está en la dirección del recurso en Coolify y en el nombre de sus
contenedores), así que sigue funcionando después de cada redeploy. El mismo script
sirve para todas las instancias. Los comandos se ejecutan en el servidor.

### 5.1 Disco aparte (recomendado)

Una sola vez, si el servidor tiene un disco para respaldos:

```bash
lsblk -o NAME,SIZE,MODEL,FSTYPE,LABEL,MOUNTPOINT   # identifica el disco
sudo mkfs.ext4 -L respaldos /dev/sdX               # ⚠ BORRA todo el disco
sudo blkid /dev/sdX                                # copia su UUID
```

Agrega a `/etc/fstab` (con `nofail` el servidor arranca aunque el disco falte):

```
UUID=<uuid> /mnt/respaldos ext4 defaults,nofail 0 2
```

```bash
sudo mkdir -p /mnt/respaldos
sudo systemctl daemon-reload
sudo mount /mnt/respaldos
```

Si es un disco usado, revisa antes su salud: `sudo smartctl -H -A /dev/sdX`
(paquete `smartmontools`).

### 5.2 Instalar y probar

```bash
sudo curl -fsSL -o /usr/local/sbin/respaldo-elnegocio https://raw.githubusercontent.com/arm-code/el-negocio/main/apps/api/scripts/backup-instance.sh
sudo chmod 755 /usr/local/sbin/respaldo-elnegocio
sudo respaldo-elnegocio <id-del-recurso> /mnt/respaldos
```

Debe responder `OK` con el número de tablas y las dos rutas. Sin disco aparte, omite
`/mnt/respaldos`: guardará en `/srv/backups/elnegocio`.

> Si instalaste la primera versión del script (solo recibe el id y ya apunta al
> disco), puede seguir así. Si la reemplazas por esta, agrega **en el mismo momento**
> `/mnt/respaldos` a la línea del cron.

### 5.3 Programarlo cada noche

La tarea usa la hora del servidor. Para ajustarla:

```bash
sudo timedatectl set-timezone America/Ciudad_Juarez
sudo systemctl restart cron
```

Archivo `/etc/cron.d/respaldo-elnegocio`, con una línea por instancia:

```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 3 * * * root /usr/local/sbin/respaldo-elnegocio <id-del-recurso> /mnt/respaldos >> /var/log/respaldo-elnegocio.log 2>&1
```

- Revisa que esté corriendo: `sudo tail -n 3 /var/log/respaldo-elnegocio.log`.
  Los errores quedan ahí, pero **no se envía ninguna alerta**.
- Se conservan 14 días.

### 5.4 Copia fuera del servidor

Un segundo disco no protege si se daña o se pierde el equipo. Copia de vez en cuando
un respaldo a otro lugar. Los archivos solo los lee `root`:

```bash
# en el servidor
sudo cat /mnt/respaldos/elnegocio/<id>/base-<fecha>.sql.gz > ~/base.sql.gz
sudo cat /mnt/respaldos/elnegocio/<id>/archivos-<fecha>.tgz > ~/archivos.tgz
```

Descárgalos con `scp` desde tu PC y bórralos de tu carpeta en el servidor. Contienen
datos de tu cliente.

### 5.5 Restaurar

> Restaurar un respaldo hecho con este script **no se ha ensayado de principio a
> fin**. Pruébalo en una instancia aparte antes de necesitarlo.

⚠ Reemplaza los datos actuales: haz primero un respaldo nuevo.

```bash
sudo docker stop <contenedor-api>
curl -fsSL -o restore-backup.sh https://raw.githubusercontent.com/arm-code/el-negocio/main/apps/api/scripts/restore-backup.sh
sudo CONTAINER=<contenedor-postgres> bash restore-backup.sh base-<fecha>.sql.gz
sudo docker start <contenedor-api>
```

Después recupera las imágenes con el paso 2 de la sección 3, usando
`archivos-<fecha>.tgz`.

## 6. Actualizar y volver atrás

- Actualizar: push a `main` → Redeploy (o activa el despliegue automático en Coolify).
  Las migraciones corren solas antes de arrancar el API.
- Volver atrás: redeploy del commit anterior. Si una migración ya se aplicó y hay que
  deshacerla, restaura el último respaldo (sección 5.5).

## 7. Un cliente nuevo

Otro recurso en Coolify con el **mismo repo** y variables propias (`BUSINESS_SLUG`,
`SITE_URL`, secretos nuevos). Con la base vacía, crea su negocio y su usuario:

```bash
docker exec -it $API node dist/src/scripts/user-admin.js create-business "Nombre del negocio" slug-del-negocio
docker exec -it $API node dist/src/scripts/user-admin.js set-password dueno@correo.com --business slug-del-negocio
```

Por último, agrega su línea a la tarea de respaldos (sección 5.3).

## 8. Si algo falla

| Síntoma | Causa probable |
|---|---|
| Login responde pero no se queda la sesión | `SITE_URL`/dominio con `http` en vez de `https` (cookie `Secure`) |
| Imágenes rotas | no se copiaron los archivos (3.2) o falta el `chown` |
| Sitio sin negocio | falta restaurar datos, o `BUSINESS_SLUG` no coincide con el de la base |
| `migrate` falla | `POSTGRES_PASSWORD` cambió después de crear el volumen: la base conserva la contraseña original |
| 502 en el dominio | el servicio `web` no está sano; revisa sus logs |
| El front se reinicia en bucle y las imágenes dan 502 (`/_next/image`) | CPU sin SSE4.2 con `IMAGE_OPTIMIZATION=true`: ponla en `false` y redespliega (sección 9) |

## 9. Pasar a producción (lista de pasos)

La máquina donde se probó este despliegue es **de pruebas** (Intel Core 2 Duo E4400, 3.7 GB de RAM,
sin SSE4.2). Al pasar a la máquina de producción, repasa esta lista en orden.

**Valores que cambian (los fáciles de olvidar):**

| Qué | En pruebas | En producción |
|---|---|---|
| `IMAGE_OPTIMIZATION` | `false` (el CPU no soporta `sharp`) | **`true`** si el CPU tiene SSE4.2 (ver abajo) |
| `POSTGRES_PASSWORD`, `JWT_SECRET`, `DOCS_PASSWORD` | los de pruebas | **nuevos**, generados otra vez; no reutilices los de pruebas |
| Puerto del proxy de Coolify | `8081` (Apache y Nextcloud ocupaban 80 y 8080) | el que tenga esa máquina (normalmente 80) |
| Ruta del tunnel de Cloudflare | `10.36.50.4:8081` | IP y puerto del proxy de la máquina de producción |

**Activar el optimizador de imágenes (`IMAGE_OPTIMIZATION=true`):**

1. Comprueba el CPU de producción: `grep -c sse4_2 /proc/cpuinfo`. Si imprime `0`, **no lo actives**.
2. En Coolify, variable `IMAGE_OPTIMIZATION` = `true`, con *Buildtime* marcado.
3. **Redeploy** (reconstruye el front; no basta reiniciar).
4. Verifica que no se cae: abre la landing y comprueba que el contador de reinicios de `web` no sube
   (`docker inspect <web> --format '{{.RestartCount}}'`), y que esto responde `200`:
   `https://<dominio>/_next/image?url=%2Ffiles%2F<negocio>%2Flogo%2F<archivo>.png&w=640&q=75`
5. Si el front se reinicia en bucle, vuelve a `false` y redespliega.

**Resto de pasos:**

- [ ] Si también despliegas el toolbox (sección 10): `IMAGE_OPTIMIZATION=true` ahí también, con el mismo criterio.
- [ ] Recursos de la máquina: con la RAM justa (en pruebas, swap lleno) compilar el front puede fallar o ir muy lento.
- [ ] Proxy de Coolify en marcha y con los puertos correctos (Servers → Proxy; comprobar con `docker ps | grep proxy`).
- [ ] Crear el recurso y cargar variables (sección 1); `SITE_URL` con el dominio real.
- [ ] Cargar datos con un respaldo **fresco** de la base y de los archivos (sección 3).
- [ ] Mover la ruta del tunnel a la nueva máquina y borrar la de la máquina de pruebas.
- [ ] Probar login, imágenes y la vista previa al compartir (WhatsApp).
- [ ] Configurar backups con cron **y** una copia fuera del servidor (sección 5).
- [ ] Solo cuando todo funcione: apagar Supabase y el proyecto viejo de Vercel (guardar antes `import/armsolutions.sql`).

## 10. Toolbox (sitio público de herramientas gratuitas)

`apps/toolbox` es independiente del stack de arriba: **no usa base de datos, API, volúmenes ni
backups** (las notas de venta se guardan en el navegador de cada visitante). Se despliega como
un recurso aparte en Coolify, desde el mismo repo.

1. **Project → New Resource → Public Git Repository**: `https://github.com/arm-code/el-negocio`,
   rama `main`.
2. **Build Pack: Dockerfile**. *Base Directory* `/apps/toolbox` y *Dockerfile Location* `/Dockerfile`.
   (No uses Docker Compose aquí: el `docker-compose.yml` de la raíz es del otro stack.)
3. **Variables de entorno**: solo `IMAGE_OPTIMIZATION` (`false` por defecto; `true` en servidores
   modernos, con *Buildtime* marcado; ver sección 9). No hay más.
4. **Dominio**: `http://<dominio-del-toolbox>` (protocolo `http`: el HTTPS lo pone Cloudflare),
   puerto **3000**.
5. **Tunnel de Cloudflare**: una ruta nueva `<dominio-del-toolbox>` → `http://<IP>:<puerto del proxy>`
   (el mismo destino que usa la instancia del pos). Si el dominio apunta hoy a Vercel, borra antes
   ese registro CNAME.
6. **Deploy** y abre el dominio: debe salir la landing con "Notas de venta".

**Comprobar la PWA** después de desplegar:

1. `curl -sI https://<dominio-del-toolbox>/sw.js` debe mostrar
   `Cache-Control: no-cache, no-store, must-revalidate`. Si Cloudflare muestra otro
   valor, purga `/sw.js` en su caché y revisa su ajuste *Browser Cache TTL*.
2. Abre el sitio, espera unos segundos, activa el modo avión y entra a "Notas de
   venta": debe abrir.

Para actualizar: push a `main` → Redeploy. Si el front se reinicia en bucle o las imágenes dan 502,
es el mismo problema de `IMAGE_OPTIMIZATION` de la sección 9.

## 11. Cambio de nombre a "El Negocio"

Solo para lo que ya estaba desplegado o instalado con los nombres anteriores. Hazlo
en este orden.

### 11.1 Repositorio

1. En GitHub: **Settings → General → Repository name** → `el-negocio`.
2. En cada recurso de Coolify, cambia el repositorio a `arm-code/el-negocio`.
3. En tu máquina: `git remote set-url origin https://github.com/arm-code/el-negocio.git`

### 11.2 Una instancia de El Negocio OS que ya tiene datos

La base y su usuario pasan de `changarro` a `elnegocio`, y el schema de
`armsolutions` a `elnegocio`. **Si redespliegas sin convertirla, `migrate` falla** y
el sitio no arranca (los datos no se tocan).

```bash
PG=<contenedor-postgres>;  API=<contenedor-api>

# 1) Respaldo con los nombres anteriores
docker exec $PG pg_dump -U changarro -d changarro --no-owner --no-acl | gzip > antes-del-cambio.sql.gz

# 2) Detener el API y convertir (la contraseña se conserva)
docker stop $API
CONTAINER=$PG bash apps/api/scripts/rename-db-to-elnegocio.sh

# 3) Redeploy en Coolify
```

Todos tendrán que **iniciar sesión otra vez** (cambió el nombre de la cookie). Los
respaldos antiguos se pueden seguir restaurando: `restore-backup.sh` los convierte.
Actualiza también la ruta de los respaldos en el cron (sección 5). Si tu usuario no
pertenece al grupo `docker`, antepón `sudo` a `docker` y usa
`sudo CONTAINER=... bash ...` para los scripts.

#### Volver atrás

Ten el script en el servidor **antes** de convertir. Devuelve los nombres anteriores
sin borrar ni restaurar datos:

```bash
docker stop <contenedor-api>        # el que esté encendido, si hay alguno
CONTAINER=<contenedor-postgres> bash apps/api/scripts/revert-db-rename.sh
```

Después enciende la versión anterior. Los nombres de los contenedores cambian en cada
despliegue; compruébalos con `docker ps -a`.

- Si **no se desplegó nada** (p. ej., falló la compilación) y los contenedores
  anteriores siguen ahí: `docker start <contenedor-api-anterior>`.
- Si ya fueron reemplazados: en Coolify, despliega el **commit anterior** (anótalo
  antes, en el historial de despliegues).

### 11.3 Cambiar el dominio del sitio gratuito

Los datos de cada visitante viven en su navegador **y ligados al dominio**. En un
dominio nuevo no aparecen sus notas, y redirigir el dominio viejo las deja
inaccesibles.

1. Despliega primero esta versión **en el dominio actual**: ya trae el botón
   **Respaldo**.
2. Publica el dominio nuevo y deja el anterior funcionando un tiempo.
3. Pide a quien tenga notas que descargue su respaldo en el dominio viejo y lo cargue
   en el nuevo (y que vuelva a instalar la app).
4. Solo entonces redirige o apaga el dominio viejo.
