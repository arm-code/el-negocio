# El Negocio — herramientas gratuitas

Sitio público de micro aplicaciones para pequeños negocios: sin cuenta, pensado primero
para celular e instalable (PWA). Es independiente del sistema de paga
([El Negocio OS](../os/README.md)): no comparte datos, sesión ni servidor con él.

[← Volver al README general](../../README.md)

- [Desarrollo local](#desarrollo-local)
- [Probar la PWA](#probar-la-pwa)
- [Estructura](#estructura)
- [Portada e instalación](#portada-e-instalación)
- [Reglas de identidad](#reglas-de-identidad)
- [Estilo](#estilo)
- [Problemas comunes](#problemas-comunes)
- [Despliegue](#despliegue)

## Desarrollo local

Todo corre en el navegador: **no usa API, base de datos, Docker ni variables de entorno**.
Los datos (p. ej. las notas de venta) se guardan en el `localStorage` del dispositivo.

Requisitos: los del [README general](../../README.md#requisitos) (Docker no hace falta).

Desde la raíz del repo:

```bash
pnpm install
```

```bash
pnpm --dir apps/toolbox dev -p 3001
```

Abre http://localhost:3001. El puerto 3001 evita chocar con `os`, que usa el 3000. Los
cambios en `packages/` también se ven al guardar.

Las apps se diseñan primero para móvil. En Chrome o Edge: `F12`, luego `Ctrl+Shift+M`
(`Cmd+Shift+M` en Mac) y un ancho de 375 px.

## Probar la PWA

La instalación y el uso sin red solo funcionan en un build de producción. Con Docker,
desde la raíz:

```bash
docker build -f apps/toolbox/Dockerfile -t toolbox-local .
```

```bash
docker run --rm -p 127.0.0.1:3010:3000 toolbox-local
```

Abre http://localhost:3010, espera unos segundos y apaga el contenedor con `Ctrl+C`: las
pantallas deben seguir abriendo. Al terminar, en las herramientas de desarrollo
(`Application` → `Storage`) usa "Clear site data".

## Estructura

Cada herramienta vive en su propio paquete; esta app solo la monta y le pone su marco.
Ver [el estándar de las micro apps](../../docs/PACKAGES-TOOLS.md).

```text
apps/toolbox/
├── app/
│   ├── page.tsx           Página de inicio
│   └── tools/<tool>/      Pantallas, con sus rutas y textos
├── components/            Solo la portada y el marco de la app
└── lib/                   Adaptadores de datos, respaldo y catálogo

packages/
├── ui/                    Tema y componentes compartidos
└── tool-<nombre>/         Pantallas, lógica, tipos y puertos de una herramienta
```

## Portada e instalación

- Se entra directo, sin avisos. La portada muestra cada micro app con una **muestra de lo
  que se obtiene** (`components/home/tool-showcase.tsx`): al agregar una herramienta,
  ponla en `lib/tools-catalog.ts` con su muestra, su botón y sus otros nombres.
- La instalación como app se ofrece en el botón **Instalar app** de la portada y dentro de
  **Respaldo**. Además se sugiere sola después de guardar algo, ya de vuelta en la pantalla
  de la herramienta: como máximo dos veces, con 14 días entre una y otra
  (`lib/install.ts`). Una herramienta nueva avisa con `markToolUsed()`.

## Reglas de identidad

Para que nadie confunda este sitio con el panel de un negocio:

- Toda micro app se monta bajo `app/tools/`: así hereda la barra fija **"El Negocio ·
  Gratis · Solo en este dispositivo"** y el botón de **Respaldo**
  (`app/tools/layout.tsx`). Es lo que distingue este sitio del panel de un negocio: no la
  quites.
- El nombre de la marca sale de `lib/brand.ts`.
- El color ladrillo es de este sitio; las instancias de El Negocio OS usan violeta.
- Una micro app nueva que guarde datos debe incluirlos en `lib/backup.ts`.
- No cambies las claves de `localStorage` ya publicadas: la gente dejaría de ver sus datos.

## Estilo

Usa solo los tokens del tema (`bg-primary`, `text-muted-foreground`...). Las micro apps
llevan superficies neutras y un acento (`packages/ui/src/theme.css`); la paleta colorida
es solo de la página de inicio. Ver
[el estándar visual](../../docs/PACKAGES-TOOLS.md).

## Problemas comunes

| Síntoma | Qué hacer |
| --- | --- |
| Puerto 3001 ocupado, o Next avisa que ya hay un servidor de desarrollo | Cierra la otra terminal que lo esté corriendo |
| No se instala como app ni funciona sin red | La PWA está desactivada en desarrollo: [pruébala así](#probar-la-pwa) |
| `pnpm install` falla con `EPERM` en Windows | Detén los servidores de desarrollo (`Ctrl+C`) y repite |
| La primera carga tarda | Normal en desarrollo: Next compila cada página al abrirla |

## Despliegue

Se despliega aparte, con `apps/toolbox/Dockerfile` y la raíz del repo como contexto. Ver
la sección 10 de [`docs/DEPLOY-COOLIFY.md`](../../docs/DEPLOY-COOLIFY.md). Antes de
cambiar su dominio, lee la sección 11.3: los datos de cada visitante dependen de él.

---

Autor: Ing. Alexis Romero Mendoza. Inicio: 2026-01-29.
