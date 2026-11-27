# Micro apps compartidas (plan y estándar de trabajo)

> Estado al 2026-11-27: fases 0 a 4 en producción (sitio gratuito y la instancia desplegada).
> Estándar corregido en la fase 5. Fase 6, **entradas y salidas** en las dos apps: falta
> llevarla a `main` y desplegar.

## 1. La idea

Cada micro app existe **una sola vez** y la usan dos aplicaciones:

| App | Qué es | Acceso | Persistencia |
| --- | --- | --- | --- |
| `apps/toolbox` | Micro apps individuales y gratuitas | Público, sin cuenta | Navegador (`localStorage`) o nada |
| `apps/os` | Versión pro: sesión, base de datos, landing y conexiones entre herramientas | Por instancia de negocio (login) | API + Postgres de la instancia |

- El toolbox ya está desplegado en <https://elchangarro.dejuarez.mx/> (landing,
  catálogo y una herramienta: notas de venta). Ese dominio es anterior al nombre
  "El Negocio"; antes de cambiarlo, leer la sección 11.3 de `DEPLOY-COOLIFY.md`.
- **Mismas herramientas, distinta casa:** la micro app es igual en ambas; el marco
  (barra, marca, color, avisos) es de cada app y no va en los paquetes.
- "Privado" significa acceso a la app, no visibilidad del repo.
- Lo exclusivo de la versión pro (por ejemplo, vincular notas con eventos) vive en
  `apps/os`. Nunca un `if (isPro)` dentro de un paquete: todo lo compartido llega
  al navegador del público.
- **Notas de venta** fue la primera y definió este estándar. Se agrega **una
  herramienta a la vez**.
- Se avanza por fases y cada fase deja las apps desplegables.

## 2. Estructura

```
packages/
  ui/                 @el-negocio/ui                 tema y componentes base
  tool-sales-notes/   @el-negocio/tool-sales-notes   notas de venta: pantallas, reglas, tipos, puertos
  tool-cash/          @el-negocio/tool-cash          entradas y salidas: lo mismo
apps/
  toolbox/            monta cada herramienta con localStorage
  os/                 monta cada herramienta con el API del negocio
pnpm-workspace.yaml   os + toolbox + packages; versiones compartidas en `catalog`
pnpm-lock.yaml        un solo lockfile para las dos apps y los paquetes
```

## Nombres

Los usa gente de mostrador (abarrotes, ferretería, panadería), no necesariamente cercana a
la tecnología.

- Se nombra por **lo que la persona hace o tiene**, con palabras de todos los días. Nada de
  "módulo", "gestión", "finanzas" o "transacciones".
- Una herramienta se llama **igual en las dos apps**. `os` puede tener más funciones, no
  otro nombre.
- El nombre vive en `meta.ts` del paquete (`title`, `shortTitle` para menús angostos) y
  las apps lo toman de ahí.

| Herramienta | Nombre | Corto | No decir | Estado |
| --- | --- | --- | --- | --- |
| Notas de venta | Notas de venta | Notas | | En las dos apps |
| Entradas y salidas | Entradas y salidas | Caja | Finanzas, movimientos, control de gastos, dinero | En las dos apps |
| Inventario | Inventario | Inventario | Gestión de inventario | En `os` |
| Eventos | Eventos | Eventos | Agenda operativa | Solo `os` |
| Contratos | Contratos de renta | Contratos | | Próximamente |
| Corte de caja | Corte de caja | Corte | Corte diario | Próximamente |
| Fiado | Libreta de fiado | Fiado | Cuentas por cobrar | Próximamente |
| Precios | Calculadora de precios | Precios | | Próximamente |
| Ventas | Mis ventas | Ventas | Reportes | Próximamente |
| Clientes | Mis clientes | Clientes | Directorio | Próximamente |

## 3. Estándar visual

**Referencia: el panel de administración de `os`.** Superficies neutras y un solo
color de acento en botones, estados activos, anillos de foco, cargadores y
skeletons. Las micro apps se ven igual en `toolbox` y en `os`.

El tema vive en `packages/ui/src/theme.css` (`@el-negocio/ui/theme.css`).
El acento es una variante (`data-accent` en `<html>`; sin atributo es `violet`).
Solo cambia estos valores:

| Variante | Token | Claro | Oscuro |
| --- | --- | --- | --- |
| `violet` | `--primary` | `oklch(0.541 0.281 293.009)` | `oklch(0.65 0.23 292.717)` |
| `violet` | `--primary-foreground` | `oklch(0.969 0.016 293.756)` | `oklch(0.969 0.016 293.756)` |
| `violet` | `--ring` | `oklch(0.702 0.183 293.541)` | `oklch(0.541 0.281 293.009)` |
| `brick` | `--primary` | `oklch(0.48 0.19 32)` | `oklch(0.68 0.17 38)` |
| `brick` | `--primary-foreground` | `oklch(0.97 0.008 74)` | `oklch(0.16 0.02 40)` |
| `brick` | `--ring` | `oklch(0.48 0.19 32)` | `oklch(0.68 0.17 38)` |

Reglas:

- Fondos, tarjetas, textos y bordes: los neutros de `theme.css`, iguales en ambas
  variantes. `os` importa ese tema; su `globals.css` solo agrega lo que es suyo.
- En las micro apps solo tokens (`bg-primary`, `text-muted-foreground`...), sin
  colores fijos. Excepción: el documento que se exporta (PDF/imagen), que debe
  salir igual en cualquier tema.
- La landing del toolbox conserva su paleta colorida: se activa cuando la página
  tiene un elemento `.landing` (`globals.css`). No se hereda a las micro apps.
- El `theme_color` del manifest debe coincidir con la variante de cada app.

## 4. Mobile first

Cada pantalla se diseña y se revisa primero a 360–375 px.

- Zonas táctiles de al menos 44 px (`TOUCH` = `h-12`).
- Campos con texto de 16 px para que iOS no haga zoom.
- Acción principal al alcance del pulgar (barra inferior o botón flotante).
- Para capturar rápido: lo habitual viene preelegido (la última categoría usada), a la
  vista hay tres opciones y lo poco frecuente (otra fecha, detalle) queda plegado.
- El color de la app no debe contradecir el significado: donde importa si el dinero
  entra o sale, se usa verde o rojo, no el acento.
- Avisos emergentes arriba, para no tapar esas acciones.
- Lo que captura el usuario se muestra como lo escribió. Excepciones: primera letra en
  mayúscula en descripciones, direcciones y notas, y en cada palabra del nombre de una
  persona (`capitalizeWords`). Ayudar al teclado con `autoCapitalize`, no transformar
  con CSS.
- Detalles y formularios cortos en hoja inferior; diálogo en escritorio.
- Respetar `env(safe-area-inset-*)`.
- Sin desplazamiento horizontal.

## 5. Estándar de una micro app

```
packages/tool-<nombre>/src/
  types.ts        dominio
  ports.ts        contratos de almacenamiento
  provider.tsx    recibe adaptadores, rutas, textos y huecos
  lib/            reglas y cálculos puros
  hooks/          react-query sobre los puertos
  components/     pantallas
  index.ts        API pública
  meta.ts         ficha para catálogos: id, título, descripción e ícono
```

1. Una herramienta **no importa otra herramienta**. Solo `ui` y librerías.
2. No sabe dónde se guardan los datos: usa puertos asíncronos.
3. No sabe en qué rutas vive: la app se las pasa, junto con los textos que dependen
   del almacenamiento ("en este dispositivo").
4. Las integraciones pro entran por huecos opcionales (por ejemplo, acciones extra
   en el detalle). El toolbox los deja vacíos.
5. `next`, `react`, `@tanstack/react-query` y `sonner` son `peerDependencies`.
6. Funciona sin red en el toolbox: sus pantallas son estáticas (el id va como
   `?id=`) y están en `OFFLINE_ROUTES`.
7. Lo que se edita se lee fresco: no se abre un formulario con una copia vieja. Un
   puerto remoto declara `staleTime: 0`.
8. Una lista se entrega completa. El API responde 10 elementos si no se pide `limit`:
   el adaptador recorre todas las páginas (`apps/os/lib/api/pagination.ts`). Si la lista
   puede crecer sin límite, el puerto debe paginar, y eso se decide al diseñarlo.
9. La herramienta valida al menos lo mismo que el API (p. ej. cantidad ≥ 1).
10. Al editar, el adaptador manda `null` en lo que se vació y no envía lo que la
    herramienta no captura, para que el API lo conserve.
11. Las claves de react-query del paquete son suyas. Otra pantalla de la app que lea los
    mismos datos usa una subclave propia (`['salesNotes', 'event-link']`): se refresca al
    guardar sin mezclar formas distintas en la caché.
12. Lo que recibe un cliente (documento exportado) se compara lado a lado con el actual y
    se aprueba antes de reemplazarlo.

Para agregar una herramienta a las apps:

1. Crear `packages/tool-<nombre>` copiando `package.json` y `tsconfig.json` de notas
   de venta. Las versiones compartidas se declaran como `catalog:`.
2. En `apps/toolbox`: dependencia `workspace:*`, nombre en `transpilePackages`
   (`next.config.ts`) y una línea `@source` en `app/globals.css`.
3. Pantallas en `app/tools/<nombre>/` con su provider, adaptador en `lib/`, entrada en
   `lib/tools-catalog.ts` y rutas en `OFFLINE_ROUTES`.
4. En `apps/os`: lo mismo del paso 2; adaptador del API en `lib/`, y el provider en el
   `layout.tsx` de las pantallas. Su `Dockerfile` necesita copiar el `package.json` del
   paquete nuevo antes de instalar.
5. `pnpm install` en la raíz y `pnpm --dir packages/tool-<nombre> typecheck`.

Contrato de notas de venta:

```ts
export interface NotesStorage {
  staleTime?: number            // 0 si los datos cambian desde otro dispositivo
  list(): Promise<Note[]>
  get(id: string): Promise<Note | null>
  create(input: NoteInput): Promise<Note>              // pone id, folio y fecha
  update(id: string, input: NoteInput): Promise<Note>  // reemplaza lo editable
  remove(id: string): Promise<void>
  subscribe?(onChange: () => void): () => void         // cambios externos
}

export interface BusinessInfoStorage {
  staleTime?: number
  get(): Promise<BusinessInfo>
  save?(info: BusinessInfo): Promise<BusinessInfo>     // sin save = solo lectura
}
```

La aplicación entrega todo junto en `<SalesNotesProvider config={...}>`:

```ts
export interface SalesNotesConfig {
  notes: NotesStorage
  business: BusinessInfoStorage
  routes: { home: string; list: string; create: string; edit(id: string): string }
  copy: SalesNotesCopy   // textos que dependen de la app o de dónde guarda
}
```

Si el adaptador guarda en el navegador, la app debe configurar react-query con
`networkMode: 'always'` (consultas y mutaciones). Con el valor por defecto, sin red
las lecturas y los guardados quedan en pausa.

### Antes de empezar una herramienta que ya existe en `os`

1. Buscar todas las pantallas de `os` que leen o escriben esos datos (otras
   herramientas, inicio, menús).
2. Comparar lo que hace `os` hoy con lo que hará el paquete, para no perder funciones.
3. Revisar en el API las validaciones, la paginación y qué conserva al editar.

### Terminada significa

- [ ] Tipos correctos en paquetes y apps; compilan las dos apps y sus imágenes Docker.
- [ ] `pnpm dev` arranca en las dos apps.
- [ ] Funciona a 375 px, en claro y en oscuro donde la app lo tenga.
- [ ] Exporta y comparte, si aplica.
- [ ] Probada con más de 100 elementos.
- [ ] Ensayo en un proyecto de Docker Compose aparte (`-p <nombre>`) sobre una copia de
      datos reales: abrir y guardar sin cambios no modifica nada. Los volúmenes
      existentes no se tocan.
- [ ] Conserva los datos ya guardados en el navegador y en la base.
- [ ] Respaldo hecho antes de desplegar.
- [ ] Probada en lo desplegado; en el sitio gratuito, también sin conexión.

## 6. Fases

### Fase 0 — Base sana del toolbox

En producción; el uso sin conexión está comprobado en el sitio.

- **PWA:** el build usaba Turbopack, con el que `@serwist/next` no genera el service
  worker, y se publicaba un `public/sw.js` viejo guardado en git. Ahora compila con
  `next build --webpack`, el archivo ya no se versiona, se sirve sin caché y la
  página no se recarga sola al volver la red.
- **Sin red:** las pantallas se precargan (`OFFLINE_ROUTES` en `next.config.ts`).
  La edición pasó de `/tools/sales-note/<id>/edit` a
  `/tools/sales-note/edit?id=<id>` para poder precargarla.
- **Textos:** quitada la mayúscula en cada palabra de avisos y textos de ejemplo.
- **Avisos:** salen arriba; abajo tapaban los botones Descargar y Compartir.

### Fase 1 — Estándar visual (dentro del toolbox, sin mover archivos)

En producción. Probada en local a 360 px, en claro y oscuro.

- Tema neutro con variantes de acento (el toolbox usa `brick`); paleta colorida
  solo en la landing; skeletons con el color de acento.
- Zonas táctiles a 44 px: volver, cerrar diálogo, confirmar/cancelar y eliminar
  concepto. La fecha del detalle ya no se parte mal.
- Lo capturado se muestra como se escribió, también en el documento exportado.

Visto y sin tocar: el teléfono se muestra agrupado como `656 1234 567`.

### Fase 2 — Puerto de almacenamiento (dentro del toolbox)

En producción.

- Puertos (`ports.ts`) y provider en la micro app; ya no conoce rutas ni
  `localStorage`.
- Adaptador del toolbox en `apps/toolbox/lib/sales-notes-storage.ts`; rutas y textos
  en `app/tools/sales-note/sales-notes-toolbox.tsx`.
- **Mismas claves**, para no perder datos de usuarios actuales:
  `bt:sales-notes:v1`, `bt:sales-notes:seq`, `bt:business-info:v1`.
- Corregido un fallo anterior: sin conexión, guardar o borrar se quedaba esperando a
  que volviera la red.
- Los huecos para integraciones pro se definen cuando una herramienta los necesite.
- Riesgo conocido, sin cambios: si el JSON guardado se corrompe, la lista sale vacía
  y el siguiente guardado lo sobrescribe.

### Fase 3 — Paquetes

En producción.

- Código compartido en `packages/ui` y `packages/tool-sales-notes`; el toolbox solo
  conserva páginas, adaptador, rutas, textos y la landing.
- Workspace en la raíz con las mismas versiones que antes; `os` entró en la fase 4.
- **Cambia el despliegue del toolbox.** El build usa la raíz del repo: en Coolify,
  `Base Directory` es `/` y `Dockerfile Location` es `/apps/toolbox/Dockerfile`
  (sección 10 de `DEPLOY-COOLIFY.md`).

Pendiente:

- `apps/toolbox/components.json` (CLI de shadcn) aún apunta a la ubicación anterior:
  por ahora los componentes nuevos se agregan a mano en `packages/ui`.
- Sin uso hoy, movidos o conservados sin borrar: `back-link`, `compact-page-header`,
  `dropdown-menu`, `load-more`, `pagination-controls`, `states`, `table`, `tabs`,
  `tool-card` (con `badge`), `useDebouncedValue` y las dependencias de formularios
  del toolbox (`react-hook-form`, `yup`).
- El lint del toolbox no revisa `packages/`.

### Fase 4 — `os` consume notas de venta

En producción desde el 2026-11-27.

- `os` entró al workspace de la raíz y comparte versiones con `catalog`. Su Dockerfile y
  el `docker-compose.yml` compilan desde la raíz del repo; en Coolify no cambia ningún
  ajuste.
- Pantallas, documento y cálculos de notas son los del paquete. Adaptador del API en
  `apps/os/lib/sales-notes-storage.ts`; rutas y textos en
  `app/(private)/tools/notas-venta/layout.tsx`. Los datos del negocio son de solo lectura
  ahí: se editan en Configuración.

  | Paquete | API |
  | --- | --- |
  | `status: 'issued'` | `'note'` |
  | `item.description` | `concept` |
  | `customer.{name, phone, address}` | `customerName`, `customerPhone`, `customerAddress` |
  | Campo vaciado | `null`; si se omite, el `PATCH` conserva el anterior |
  | Correo del cliente y evento vinculado | no se envían: el API los conserva |
  | `list()` completo | recorre todas las páginas (100 por página) |

- Corregido: `os` solo mostraba las 10 notas más recientes, en la lista y al vincularlas
  a un evento.
- El documento usa colores fijos y pone mayúscula en cada palabra del nombre del cliente.
- La cantidad mínima por concepto es 1 en las dos apps.
- El vínculo nota–evento sigue en las pantallas de eventos de `os`; no hizo falta un hueco
  en el paquete.

Pendiente:

- `noteId` (evento) y `eventId` (nota) pueden desincronizarse: cada pantalla escribe el suyo.
- `os` conserva sus propios componentes base para el resto de sus pantallas, y su
  `document-actions` para el contrato de eventos.
- El API no garantiza el orden de los conceptos de una nota.
- Los PDF exportados pesan varios megabytes (la imagen va sin comprimir).

### Fase 5 — Cierre

Estándar corregido con lo aprendido (sección 5). Lecciones que lo motivaron:

- La fase 3 dejó `pnpm dev` de `os` sin arrancar porque solo se probó el toolbox.
- Las listas que no pedían `limit` mostraban 10 elementos sin avisar (notas, eventos,
  categorías y formas de pago).
- Un usuario nuevo no podía registrar nada: se probaba siempre con datos ya existentes.
  Probar también sobre una base vacía.

Elegida: **entradas y salidas** (control de gastos). Comparación usada:

| Candidata | En `os` hoy (líneas aprox.) | Acoplamiento | Lo que implica |
| --- | --- | --- | --- |
| **Control de gastos** (propuesta) | 1 100 de pantallas; el API ya existe | Ninguno visto en sus pantallas | Primera lista que crece sin límite: el puerto debe paginar y dar el resumen. `os` hoy no permite editar ni borrar movimientos |
| Contratos de evento | 200 del documento, dentro de 1 800 de eventos | Sale de un evento; no tiene datos propios | La versión gratuita necesita su propia captura |
| Inventario | 2 500, con artículos, ubicaciones y movimientos | Propio, pero amplio | La más grande de las tres |
| Punto de venta | — | — | Al final |

El catálogo del sitio gratuito anuncia "Cotizaciones" como próxima, y las notas de venta
ya las hacen.

### Fase 6 — Entradas y salidas

Acordado el 2026-11-27:

| Tema | Decisión |
| --- | --- |
| Resumen | Del mes actual, con opción de cambiar de mes o ver todo |
| Editar y borrar | En las dos apps |
| Categorías en el sitio gratuito | Genéricas ya cargadas (Ventas, Compras, Sueldos, Transporte, Servicios, Otros) y se pueden agregar |
| Eventos | La micro app no los muestra; los vínculos existentes se conservan |
| Respaldo del sitio gratuito | Incluye los movimientos; los respaldos anteriores siguen cargando |

1. **API (hecho):** la lista desempata por folio, así no se repiten ni se pierden
   movimientos entre páginas; `GET /transactions/summary` acepta `dateFrom` y `dateTo`.
2. **Paquete y sitio gratuito (hecho):** `packages/tool-cash`, montado en `/tools/cash`.
   Es una sola pantalla: anotar, corregir y borrar van en hojas, así abre sin red.
   Adaptador en `apps/toolbox/lib/cash-storage.ts`; si lo guardado está dañado, avisa y
   no lo sobrescribe. El respaldo suma los movimientos (misma versión: los anteriores
   siguen cargando).
3. **`os` (hecho en local):** misma pantalla en `/tools/finanzas` (la dirección no cambió),
   con adaptador en `apps/os/lib/cash-storage.ts`:

   | Paquete | API |
   | --- | --- |
   | `kind: 'in' / 'out'` | `type: 'INPUT' / 'OUTPUT'` |
   | `date`, `method` | `transactionDate`, `paymentMethod` |
   | Lista | `GET /transactions` por páginas de 30, filtrado por fechas |
   | Detalle vaciado | `null` |
   | Categoría y forma de pago | al corregir solo se envían si cambian (el API rechaza las desactivadas) |
   | Evento vinculado | no se envía: se conserva |

   - Los ajustes de categorías y formas de pago entran por el hueco `headerAction`.
   - Preelegidas la primera vez: "Otros" y "Efectivo"; después, las últimas usadas.
   - El inicio de `os` sigue mostrando el total histórico.
   - Un negocio sin nada anotado este mes ve el mes vacío; el historial está en "Ver todo".

## 7. Cuidados

- Servidor de pruebas con CPU viejo: mantener `IMAGE_OPTIMIZATION=false`.
- Cambios en una rama basada en `dev`; `main` es producción.
- Un paquete compartido afecta a las dos apps: compilar ambas antes de cada merge.
- No cambiar las claves de `localStorage` ya publicadas.

## 8. Decisiones pendientes

| Decisión | Propuesta |
| --- | --- |
| ¿Quién elige la variante? | Fija por app al inicio; selector por negocio después |
| Componentes base de `os` fuera de las micro apps | Pasarlos a `packages/ui` conforme cada pantalla se vuelva micro app |
