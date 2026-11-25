# packages/tools — herramientas compartidas (plan de trabajo)

> Documento para arrancar la feature en una sesión nueva. Nada de esto está
> implementado todavía: hoy no existe la carpeta `packages/`.

## Objetivo

Que las herramientas (notas de venta, cotizaciones, etc.) vivan **una sola vez**
y las usen dos apps:

| App | Acceso | Persistencia |
| --- | --- | --- |
| `apps/os` | Solo quien tiene una instancia de negocio (login) | API + Postgres de la instancia |
| `apps/toolbox` | Público y gratis, sin cuenta | Ninguna en servidor: navegador (`localStorage`) o nada |

"Privado" significa **acceso a la app**, no visibilidad del repo (el repo puede
seguir público).

## Diseño

- `packages/tools` contiene UI + lógica de cada herramienta. **No sabe dónde se
  guardan los datos.**
- Cada herramienta recibe un **adaptador de almacenamiento** (puerto), por ejemplo:
  ```ts
  interface NotesStorage {
    list(): Promise<Note[]>;
    get(id: string): Promise<Note | null>;
    save(note: Note): Promise<void>;
    remove(id: string): Promise<void>;
  }
  ```
  - toolbox inyecta un adaptador de `localStorage` (hoy en
    `apps/toolbox/features/sales-notes/lib/storage.ts`).
  - os inyecta uno que llama al API de la instancia (fase 3).
- El catálogo (`apps/toolbox/lib/tools-catalog.ts`) pasa al paquete.

## Punto de partida (estado actual)

- `apps/toolbox/features/sales-notes/` tiene componentes, hooks
  (`use-sales-notes`, `use-business-info`), `lib/` (calculations, export-document,
  format, storage), `types.ts`, `routes.ts`, `index.ts`.
- `apps/toolbox/lib/`: `tools-catalog.ts`, `display.ts`, `utils.ts`.
- Rutas en `apps/toolbox/app/tools/sales-note/...`.
- Cada app tiene su propio `package.json`, `pnpm-lock.yaml` y Dockerfile
  (contexto de build = la carpeta de la app; `Base Directory` en Coolify).
- Toolbox: Next 16.1.6, React 19, Tailwind 4, Serwist (PWA), jspdf, html-to-image,
  react-hook-form + yup, radix-ui, shadcn.

## Fases

1. **Workspace.** Crear `pnpm-workspace.yaml` en la raíz con **solo**
   `apps/toolbox` y `packages/*` (NO incluir `apps/os` ni `apps/api`, para no
   alterarles el flujo). Crear `packages/tools` (`package.json`, `tsconfig`,
   exports). Un lockfile en la raíz; `apps/toolbox/pnpm-lock.yaml` desaparece.
2. **Mover `sales-notes`** y el catálogo a `packages/tools`, con el adaptador de
   almacenamiento; toolbox lo consume con el adaptador `localStorage`.
   Verificar: `pnpm build` de toolbox, PWA/service worker, exportar PDF/imagen.
   Ajustar `apps/toolbox/Dockerfile` (contexto = raíz del repo, copiar
   `packages/tools`, `pnpm install --frozen-lockfile` con filtro) y, en Coolify,
   `Base Directory` y ruta del Dockerfile **en el mismo momento** del merge.
3. **Conectar `os`** (aparte): adaptador API, y su propia migración a workspace
   y Dockerfile.

## Riesgos y cuidados

- **Despliegues actuales:** `api` y `os` no se tocan en las fases 1–2 (Coolify
  construye con el contexto de su carpeta y no ve la raíz). Solo cambia toolbox.
  Antes de la fase 2, confirmar si toolbox ya está desplegado en Coolify.
- Un `pnpm-workspace.yaml` en la raíz puede afectar instalaciones locales dentro
  de `apps/os`/`apps/api`: probar `pnpm install` en ambas antes de subir.
- Next debe transpilar el paquete: `transpilePackages: ['@elchangarro/tools']`
  (o compilar el paquete). Tailwind 4 necesita `@source` apuntando al paquete
  para detectar sus clases.
- Componentes de UI (shadcn) compartidos: decidir si viven en el paquete o se
  quedan en cada app (no duplicar).
- Servidor de pruebas con CPU viejo: mantener `IMAGE_OPTIMIZATION=false`.
- Un paso a la vez, confirmando que funciona antes de avanzar.

## Prompt sugerido para la sesión nueva

> Lee `docs/PACKAGES-TOOLS.md` del monorepo `elchangarro` y empecemos por las
> fases 1 y 2 (workspace + mover `sales-notes` a `packages/tools` con adaptador
> de almacenamiento). Primero revisa cómo está hecho `sales-notes` y propón el
> adaptador antes de mover código. Un paso a la vez.
