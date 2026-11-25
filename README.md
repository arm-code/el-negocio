# El Changarro

Monorepo de **El Changarro OS**: sistema de control para negocios pequeños
(notas de venta, finanzas, eventos, inventario y landing pública).

```
apps/
├── api/   API (NestJS + Postgres propio). Auth con cookie JWT, archivos en disco.
├── os/    Front del pos (Next.js): landing pública + panel de administración.
└── toolbox/  Herramientas gratuitas para el público (Next.js, sin backend; datos en el navegador).
```

Cada app es independiente (su propio `package.json`, lockfile y Dockerfile), así
que se despliega por separado desde su carpeta (`Base Directory` en Coolify).
El plan para compartir micro apps entre `os` y `toolbox` está en
[`docs/PACKAGES-TOOLS.md`](docs/PACKAGES-TOOLS.md).

## Modelo: una instancia = un negocio

Cada cliente tiene su propia instancia (API + base de datos + front). El API
decide su negocio con `BUSINESS_SLUG`. No hay multi-tenant.

## Desarrollo local

Los comandos sirven en PowerShell y en bash. Cada bloque indica desde qué carpeta
se corre.

### Requisitos

- Git
- Node.js 22
- pnpm 10: `npm install -g pnpm@10.19.0`
- Docker con Compose (por ejemplo, Docker Desktop), solo para `os` y el API

| Qué quieres correr | Necesitas levantar | Dirección |
| --- | --- | --- |
| Toolbox | Solo el toolbox | http://localhost:3001 |
| OS (landing y administración) | Postgres + API (Docker) y `os` | http://localhost:3000 |

### Toolbox

No usa API, base de datos ni variables de entorno. Desde la raíz del repo:

```bash
pnpm --dir apps/toolbox install
pnpm --dir apps/toolbox dev -p 3001
```

El `-p 3001` evita chocar con `os`, que usa el puerto 3000.

### OS: primera vez

**1. Configura el API.** Desde la raíz:

```bash
cd apps/api
cp .env.template .env
```

En `apps/api/.env` ajusta estas líneas:

| Variable | Valor en local |
| --- | --- |
| `JWT_SECRET` | Un secreto largo y aleatorio (comando abajo) |
| `DOCS_PASSWORD` | Cualquier contraseña tuya |
| `COOKIE_SECURE` | `false` (quita el `#`; en local no hay HTTPS) |
| `BUSINESS_SLUG` | El identificador del negocio que crearás en el paso 3, p. ej. `mi-negocio` |

Para generar el secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Las variables `DB_*` no hace falta tocarlas: Docker Compose define las suyas.

**2. Levanta la base de datos y el API.** Desde `apps/api`, un comando a la vez:

```bash
docker compose build migrate api
docker compose up -d --wait postgres
docker compose run --rm migrate
docker compose up -d --wait api
```

**3. Crea tu negocio y tu usuario** (la base empieza vacía). Desde `apps/api`:

```bash
docker compose exec api node dist/src/scripts/user-admin.js create-business "Mi negocio" mi-negocio
docker compose exec api node dist/src/scripts/user-admin.js set-password dev@example.test --business mi-negocio
```

El segundo comando pide la contraseña (mínimo 10 caracteres; no se muestra al
escribirla). Cada base admite **un solo negocio**.

**4. Levanta el front.** Desde `apps/api`:

```bash
cd ../os
cp template.env .env.local
```

En `apps/os/.env.local` pon el **mismo** `JWT_SECRET` que en `apps/api/.env`. Luego:

```bash
pnpm install
pnpm dev
```

Entra en http://localhost:3000/auth/login con el usuario del paso 3.

### Día a día

API y base de datos, desde `apps/api`:

```bash
docker compose up -d --wait postgres api
```

Cada front en su propia terminal, desde la raíz:

```bash
pnpm --dir apps/os dev
```

```bash
pnpm --dir apps/toolbox dev -p 3001
```

Los cambios en `os` y `toolbox` se ven al guardar. Para apagar el API y la base
sin perder datos, desde `apps/api`: `docker compose stop`.

### Después de traer cambios

Dependencias, desde la raíz:

```bash
pnpm --dir apps/os install
pnpm --dir apps/toolbox install
```

El API corre dentro de un contenedor y **no recarga solo**. Si cambió algo en
`apps/api`, desde esa carpeta:

```bash
docker compose build migrate api
docker compose run --rm migrate
docker compose up -d --wait api
```

### Probar en tamaño celular

Las apps se diseñan primero para móvil. En Chrome o Edge: `F12`, luego
`Ctrl+Shift+M` (`Cmd+Shift+M` en Mac) y un ancho de 375 px.

### Problemas comunes

| Síntoma | Qué hacer |
| --- | --- |
| `port is already allocated` (5432 o 3500) | Otro contenedor o un Postgres instalado usa el puerto. Revisa con `docker ps` y detenlo |
| Puerto 3000 o 3001 ocupado, o Next avisa que ya hay un servidor de desarrollo | Cierra la otra terminal que lo esté corriendo |
| El login no entra o regresa a la pantalla de acceso | Revisa que `JWT_SECRET` sea igual en ambos archivos y que `COOKIE_SECURE=false`. Reinicia `pnpm dev`; si cambiaste el `.env` del API, `docker compose up -d --wait api` |
| `database "changarro" does not exist` o `no pg_hba.conf entry` | La primera inicialización de Postgres quedó a medias. `docker compose down -v` y repite el paso 2. **Borra la base y los archivos locales** |
| `create-business` dice que ya hay un negocio | Esa base ya tiene uno: usa su identificador en `BUSINESS_SLUG` |
| `pnpm` avisa `Ignored build scripts` | En las pruebas de esta guía no impidió arrancar `os` |
| La primera carga tarda | Normal en desarrollo: Next compila cada página al abrirla |
| El toolbox no se instala como app ni funciona sin red | La PWA está desactivada en desarrollo |

Para trabajar con una copia de datos reales, ver `apps/api/scripts/` y la sección 3
de [`docs/DEPLOY-COOLIFY.md`](docs/DEPLOY-COOLIFY.md).

## Despliegue

Una instancia se despliega con el `docker-compose.yml` de la raíz (Postgres + API + front).
Guía paso a paso para Coolify, carga de datos y backups: [`docs/DEPLOY-COOLIFY.md`](docs/DEPLOY-COOLIFY.md).
**Antes de pasar a producción**, revisa la sección *9. Pasar a producción* de esa guía
(incluye `IMAGE_OPTIMIZATION`, que difiere entre la máquina de pruebas y producción).
Para probar el stack completo en tu máquina:

```bash
cp .env.example .env     # completa los valores
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
# → http://localhost:8080
```

## Ramas

`main` es producción y `dev` es integración. Los cambios nuevos se hacen en una
rama basada en `dev` (ver `apps/os/README.md`).

## Historial

Los repos originales (`arm-solutions-api` y `i-am-a-pos-frontend`) se importaron
con todo su historial de commits. Los commits anteriores conservan sus rutas
antiguas (sin el prefijo `apps/api/` ni `apps/os/`).
