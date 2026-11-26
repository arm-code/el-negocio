# El Negocio OS

Sistema de gestión de **un** negocio: su página pública y su panel de administración.
Cada cliente tiene una instancia propia, que muestra su nombre y su logo. No enlaza ni
comparte nada con el sitio de herramientas gratuitas ([El Negocio](../toolbox/README.md)).
---

### Pasos a seguir para poder ejecutar el proyecto
La guía completa (API, base de datos, usuario y front) está en el
[README de la raíz](../../README.md#desarrollo-local).

- Este front necesita el API encendido y un archivo `.env.local` basado en `template.env`.
- Cada instancia atiende a un solo negocio: el API decide cuál con su variable `BUSINESS_SLUG`. El front no necesita saber su slug.
---

### Gestión de las ramas de git
- Hay dos ramas principales `dev` y `main`.
- Para trabajar en nuevos features hay que crear una  nueva rama basada en `dev`.
- Se recomienda la siguiente nomeclatura para los nombres de las ramas `[nombre-feature]-[fecha]-[Iniciales-Usuario]`. Ej. `login-251024-ARM`.

### Mandar cambios a las ramas principales.
- Hay que desarrollar el `feature` en la rama creada basada en `dev`.
- Una vez corroborado que funcione correctamente, hacer `pull request` a la rama `dev`. Resolver conflictos si es necesario.
- Pedir autorización para hacer `merge`.
- Verificar que los cambios funcionen correctamente en `dev`, y despues hacer `pull request` a `main`, para proceder con el `merge`.

---


### Pasos para agregar componentes de `shadcn` 
- Asegurate de tener instalada la libreria `pnpm dlx shadcn@latest init`
- Para agregar un componente `pnpm dlx shadcn@latest add [nombre-del-cpmponente]`
- Puedes consultar los diferentes componentes en `https://ui.shadcn.com/docs/components`




