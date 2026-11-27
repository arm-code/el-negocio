# El Negocio OS

Sistema de gestión de **un** negocio: su página pública y su panel de administración.
Cada cliente tiene una instancia propia, que muestra su nombre y su logo. No enlaza ni
comparte nada con el sitio de herramientas gratuitas ([El Negocio](../toolbox/README.md)).

[← Volver al README general](../../README.md)

- [Desarrollo local](#desarrollo-local)
- [Estructura](#estructura)
- [Probar el stack completo](#probar-el-stack-completo)
- [Problemas comunes](#problemas-comunes)
- [Despliegue](#despliegue)

## Desarrollo local

Son tres piezas: **Postgres** y el **API** corren en Docker; este front corre con pnpm.

> **Todos los comandos se escriben en la raíz del repo**, no en `apps/os`. Sirven en
> PowerShell y en bash.

Requisitos: los del [README general](../../README.md#requisitos), Docker incluido.

En desarrollo se usa `apps/api/docker-compose.yml` (por eso los comandos llevan `-f`).
El `docker-compose.yml` de la raíz es el del [despliegue](#despliegue).

### ¿Qué tengo que hacer?

| Situación | Qué hacer |
| --- | --- |
| Primera vez en esta máquina | [Instalación](#instalación), pasos 1 a 4 |
| Apagué la PC o detuve todo | [Arrancar](#arrancar) |
| Borré los contenedores (`down`, o desde Docker Desktop) | [Arrancar](#arrancar). La base se conserva |
| Borré las imágenes | [Arrancar](#arrancar). Se reconstruyen solas; tarda más |
| Borré los volúmenes (`down -v`): **se perdió la base** | Pasos 2 y 3, y luego arrancar |
| Borré `apps/api/.env` o `apps/os/.env.local` | Paso 1, y luego arrancar |
| Hice `git pull` | [Después de traer cambios](#después-de-traer-cambios) |

La base y los archivos subidos viven en los **volúmenes** `el-negocio-api_pgdata` y
`el-negocio-api_storage`, no en los contenedores.

### Arrancar

Con Docker abierto:

```bash
docker compose -f apps/api/docker-compose.yml up -d --wait postgres api
```

```bash
pnpm --dir apps/os dev
```

Entra en http://localhost:3000/auth/login. Para apagar: `Ctrl+C` en la terminal del
front y, para el API y la base (sin perder datos):

```bash
docker compose -f apps/api/docker-compose.yml stop
```

### Instalación

**1. Crea los dos archivos de configuración.** Ojo: `cp` sobrescribe los que ya existan.

```bash
cp apps/api/.env.template apps/api/.env
```

```bash
cp apps/os/template.env apps/os/.env.local
```

Genera un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

En `apps/api/.env` ajusta:

| Variable | Valor en local |
| --- | --- |
| `JWT_SECRET` | El secreto que generaste |
| `DOCS_PASSWORD` | Cualquier contraseña tuya |
| `COOKIE_SECURE` | `false` (quita el `#`; en local no hay HTTPS) |
| `BUSINESS_SLUG` | El identificador del negocio del paso 3, p. ej. `mi-negocio` |

En `apps/os/.env.local` pega el **mismo** `JWT_SECRET`. Las variables `DB_*` no hace
falta tocarlas: Docker Compose define las suyas.

**2. Crea la base y levanta el API.** Un comando a la vez:

```bash
docker compose -f apps/api/docker-compose.yml build migrate api
```

```bash
docker compose -f apps/api/docker-compose.yml up -d --wait postgres
```

```bash
docker compose -f apps/api/docker-compose.yml run --rm migrate
```

```bash
docker compose -f apps/api/docker-compose.yml up -d --wait api
```

**3. Crea tu negocio y tu usuario** (la base empieza vacía). El identificador debe ser el
de `BUSINESS_SLUG`.

```bash
docker compose -f apps/api/docker-compose.yml exec api node dist/src/scripts/user-admin.js create-business "Mi negocio" mi-negocio
```

```bash
docker compose -f apps/api/docker-compose.yml exec api node dist/src/scripts/user-admin.js set-password dev@example.test --business mi-negocio
```

El segundo comando pide la contraseña (mínimo 10 caracteres; no se muestra al
escribirla). Cada base admite **un solo negocio**.

**4. Instala las dependencias y arranca el front:**

```bash
pnpm install
```

```bash
pnpm --dir apps/os dev
```

Entra en http://localhost:3000/auth/login con el usuario del paso 3.

### Después de traer cambios

```bash
pnpm install
```

El API corre dentro de un contenedor y **no recarga solo**. Si cambió algo en
`apps/api`:

```bash
docker compose -f apps/api/docker-compose.yml build migrate api
```

```bash
docker compose -f apps/api/docker-compose.yml up -d --wait postgres
```

```bash
docker compose -f apps/api/docker-compose.yml run --rm migrate
```

```bash
docker compose -f apps/api/docker-compose.yml up -d --wait api
```

### Datos reales o nombres anteriores

Para trabajar con una copia de datos reales, ver `apps/api/scripts/` y la sección 3
de [`docs/DEPLOY-COOLIFY.md`](../../docs/DEPLOY-COOLIFY.md).

Si ya tenías el entorno con los nombres anteriores: la base y su usuario pasaron de
`changarro` a `elnegocio`, y el schema de `armsolutions` a `elnegocio`. Los contenedores
locales ahora se llaman `el-negocio-api-*` y usan volúmenes nuevos. Si no te importan los
datos locales, detén los contenedores viejos y sigue la [Instalación](#instalación). Para
conservarlos, ver la sección 11 de esa misma guía.

## Estructura

```text
apps/os/
├── app/
│   ├── (public)/          Landing del negocio e inicio de sesión
│   └── (private)/         Panel: inicio, herramientas y configuración
├── components/            Componentes propios del panel y de la landing
├── lib/                   Clientes del API y adaptadores de las micro apps
└── proxy.ts               Protege las rutas del panel
```

- Las micro apps compartidas vienen de `packages/`; aquí solo se montan con su adaptador
  del API. Ver [el estándar de las micro apps](../../docs/PACKAGES-TOOLS.md).
- El front no necesita saber su `BUSINESS_SLUG`: el API decide qué negocio atiende.
- Componentes de shadcn propios del panel, desde `apps/os`:
  `pnpm dlx shadcn@latest add <componente>`
  ([catálogo](https://ui.shadcn.com/docs/components)).

## Probar el stack completo

Para probar en tu máquina lo mismo que se despliega (Postgres + API + front), desde la
raíz:

```bash
cp .env.example .env
```

Completa los valores de `.env` y levanta el stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Abre http://localhost:8080.

## Problemas comunes

| Síntoma | Qué hacer |
| --- | --- |
| `port is already allocated` (5432 o 3500) | Otro contenedor o un Postgres instalado usa el puerto. Revisa con `docker ps` y detenlo |
| Puerto 3000 ocupado, o Next avisa que ya hay un servidor de desarrollo | Cierra la otra terminal que lo esté corriendo |
| El login no entra o regresa a la pantalla de acceso | Revisa que `JWT_SECRET` sea igual en ambos archivos y que `COOKIE_SECURE=false`. Reinicia `pnpm dev`; si cambiaste el `.env` del API, `docker compose -f apps/api/docker-compose.yml up -d --wait api` |
| `database "elnegocio" does not exist` o `no pg_hba.conf entry` | La primera inicialización de Postgres quedó a medias. `docker compose -f apps/api/docker-compose.yml down -v` y repite los pasos 2 y 3. **Borra la base y los archivos locales** |
| `create-business` dice que ya hay un negocio | Esa base ya tiene uno: usa su identificador en `BUSINESS_SLUG` |
| `pnpm` avisa `Ignored build scripts` | En las pruebas de esta guía no impidió arrancar `os` |
| `pnpm install` falla con `EPERM` en Windows | Detén los servidores de desarrollo (`Ctrl+C`) y repite |
| La primera carga tarda | Normal en desarrollo: Next compila cada página al abrirla |

## Despliegue

Una instancia se despliega con el `docker-compose.yml` de la raíz. La imagen de este front
se compila desde la raíz del repo porque usa `packages/`. Guía paso a paso para Coolify,
carga de datos y respaldos: [`docs/DEPLOY-COOLIFY.md`](../../docs/DEPLOY-COOLIFY.md).
