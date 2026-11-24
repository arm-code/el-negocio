import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
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
