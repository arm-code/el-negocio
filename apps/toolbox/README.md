# El Negocio — herramientas gratuitas

Sitio público de micro aplicaciones para pequeños negocios: sin cuenta, pensado primero
para celular e instalable (PWA). Es independiente del sistema de paga
([El Negocio OS](../os/README.md)): no comparte datos, sesión ni servidor con él.

#### Autor
- Ing. Alexis Romero Mendoza
- Inicio: 2026-01-29

## Arrancar en local

Desde la raíz del repo (instala la app y `packages/`):

```bash
pnpm install
pnpm --dir apps/toolbox dev -p 3001
```

Abre [http://localhost:3001](http://localhost:3001). El puerto 3001 evita chocar con
`apps/os`. La guía completa está en el
[README principal](../../README.md#desarrollo-local).

## Sin backend ni variables de entorno

Todo corre en el navegador: los datos (p. ej. las notas de venta) se guardan en el
`localStorage` del dispositivo. No hay nada que configurar.

## Dónde va cada cosa

Cada herramienta vive en su propio paquete; esta app solo la monta y le pone su marco.
Ver [el estándar de las micro apps](../../docs/PACKAGES-TOOLS.md).

```text
apps/toolbox/
├── app/
│   ├── page.tsx           # Página de inicio
│   └── tools/<tool>/      # Pantallas, con sus rutas y textos
├── components/            # Solo la portada y el marco de la app
└── lib/                   # Adaptadores de datos, respaldo y catálogo

packages/
├── ui/                    # Tema y componentes compartidos
└── tool-<nombre>/         # Pantallas, lógica, tipos y puertos de una herramienta
```

## Reglas de identidad

Para que nadie confunda este sitio con el panel de un negocio:

- Toda micro app se monta bajo `app/tools/`: así hereda la barra fija **"El Negocio ·
  Gratis"**, el aviso de la primera vez y el botón de **Respaldo**
  (`app/tools/layout.tsx`).
- El nombre de la marca sale de `lib/brand.ts`.
- El color ladrillo es de este sitio; las instancias de El Negocio OS usan violeta.
- Una micro app nueva que guarde datos debe incluirlos en `lib/backup.ts`.
- No cambies las claves de `localStorage` ya publicadas: la gente dejaría de ver sus datos.

## Estilo

Usa solo los tokens del tema (`bg-primary`, `text-muted-foreground`...). Las micro apps
llevan superficies neutras y un acento (`packages/ui/src/theme.css`); la paleta colorida
es solo de la página de inicio. Ver
[el estándar visual](../../docs/PACKAGES-TOOLS.md).
