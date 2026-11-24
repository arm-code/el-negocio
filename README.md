# El Changarro

Monorepo de **El Changarro OS**: sistema de control para negocios pequeños
(notas de venta, finanzas, eventos, inventario y landing pública).

```
apps/
├── api/   API (NestJS + Postgres propio). Auth con cookie JWT, archivos en disco.
└── os/    Front del pos (Next.js): landing pública + panel de administración.
```

Cada app es independiente (su propio `package.json`, lockfile y Dockerfile), así
que se despliega por separado desde su carpeta (`Base Directory` en Coolify).
Más adelante se agregarán `apps/toolbox` y `packages/tools` sin tocar lo anterior.

## Modelo: una instancia = un negocio

Cada cliente tiene su propia instancia (API + base de datos + front). El API
decide su negocio con `BUSINESS_SLUG`. No hay multi-tenant.

## Desarrollo local

API (requiere Docker):

```bash
cd apps/api
cp .env.template .env          # y completa los valores (JWT_SECRET, etc.)
docker compose up -d postgres
docker compose run --rm migrate
docker compose up -d --build api
```

Front:

```bash
cd apps/os
cp template.env .env.local     # mismo JWT_SECRET que el API
pnpm install
pnpm dev
```

Más detalle en `apps/api/scripts/` (backup, importación de datos, usuarios) y en
el `README` de cada app.

## Ramas

`main` es producción y `dev` es integración. Los cambios nuevos se hacen en una
rama basada en `dev` (ver `apps/os/README.md`).

## Historial

Los repos originales (`arm-solutions-api` y `i-am-a-pos-frontend`) se importaron
con todo su historial de commits. Los commits anteriores conservan sus rutas
antiguas (sin el prefijo `apps/api/` ni `apps/os/`).
