# El Negocio API

Backend de [El Negocio OS](../os/README.md): NestJS sobre Postgres propio, sesión con
cookie JWT y archivos en disco. Cada instancia atiende a un solo negocio
(`BUSINESS_SLUG`).

- Arrancar en local (base y API en Docker): [guía de El Negocio OS](../os/README.md#desarrollo-local).
- Desplegar una instancia: [`docs/DEPLOY-COOLIFY.md`](../../docs/DEPLOY-COOLIFY.md).
- Documentación de los endpoints: `/docs` en el API (pide `DOCS_USER` y `DOCS_PASSWORD`).

## Accesos

- Sin registro público. La cuenta principal y el negocio se crean por comando
  (`user-admin.js`); las demás desde El Negocio OS, en **Equipo**.
- `admin` puede todo; `editor` (empleado) no entra a Caja, resumen ni ajustes. Se declara
  con `@AdminOnly()` o `@AdminWrites()` en el controlador.
- Cambiar la contraseña o quitar a alguien cierra sus sesiones.

## Avisos

Web Push, sin servicios de paga. Variables opcionales:

| Variable | Para qué | Por defecto |
| --- | --- | --- |
| `BUSINESS_TZ` | Hora de los recordatorios | `America/Ciudad_Juarez` |
| `VAPID_SUBJECT` | Quién firma los avisos (`https://…` o `mailto:…`) | la dirección del proyecto |
| `REMINDERS` | `off` apaga los recordatorios | encendidos |

El API necesita salir a internet para entregar los avisos.

Autor: Ing. Alexis Romero Mendoza.
