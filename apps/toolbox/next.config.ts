import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Raíz del monorepo: de ahí salen los paquetes compartidos y las dependencias.
const REPO_ROOT = path.join(__dirname, "..", "..");

// Pantallas que se guardan al instalar el service worker para que abran sin red.
// Solo rutas estáticas (una pantalla que reciba `?id=` cuenta; ver app/sw.ts).
// Al agregar una herramienta, agrega aquí sus pantallas.
const OFFLINE_ROUTES = [
  "/",
  "/tools/sales-note",
  "/tools/sales-note/new",
  "/tools/sales-note/edit",
  "/tools/cash",
];
// Cambia en cada build, así cada despliegue vuelve a descargar esas pantallas.
const BUILD_REVISION = randomUUID();

// El build usa `next build --webpack`: @serwist/next no genera el service worker
// con Turbopack.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  // true (valor por defecto) recarga la página al volver la red y se pierde lo
  // que se estuviera capturando.
  reloadOnOnline: false,
  manifestTransforms: [
    async (entries) => ({
      manifest: [
        ...entries,
        ...OFFLINE_ROUTES.map((url) => ({ url, revision: BUILD_REVISION, size: 0 })),
      ],
      warnings: [],
    }),
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Los paquetes se publican como TypeScript: Next los compila junto con la app
  transpilePackages: ["@el-negocio/ui", "@el-negocio/tool-sales-notes", "@el-negocio/tool-cash"],
  outputFileTracingRoot: REPO_ROOT,
  // `next dev` usa Turbopack; sin esta clave se queja de la configuración de webpack
  turbopack: { root: REPO_ROOT },
  // Que ni el navegador ni Cloudflare guarden el service worker: si no, un
  // despliegue nuevo tarda horas en llegar.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
  // Imagen de Docker mínima: copia solo lo necesario para `node server.js`
  output: "standalone",
  images: {
    // Optimizador de imágenes de Next: usa `sharp`, que exige un CPU con SSE4.2.
    // En CPUs viejos el proceso muere con "Illegal instruction" (reinicio en bucle).
    //   IMAGE_OPTIMIZATION=true → activado (servidores modernos / producción)
    //   cualquier otro valor    → desactivado (valor por defecto, funciona en cualquier CPU)
    // Se fija al COMPILAR. Ver docs/DEPLOY-COOLIFY.md.
    unoptimized: process.env.IMAGE_OPTIMIZATION !== "true",
  },
} as any;

export default withSerwist(nextConfig);
