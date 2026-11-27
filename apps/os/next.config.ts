import type { NextConfig } from "next";
import path from "node:path";

// Raíz del monorepo: de ahí salen los paquetes compartidos y las dependencias.
const REPO_ROOT = path.join(__dirname, "..", "..");

const isProd = process.env.NODE_ENV === 'production';

// Origen del API para los rewrites. En el stack de Docker es el contenedor `api`;
// en desarrollo, el API local. Se fija al compilar.
const API_ORIGIN = process.env.INTERNAL_API_ORIGIN ?? (isProd ? 'http://api:3500' : 'http://localhost:3500');

const nextConfig: NextConfig = {
  // Imagen de Docker mínima: copia solo lo necesario para `node server.js`
  output: 'standalone',

  // Los paquetes se publican como TypeScript: Next los compila junto con la app
  transpilePackages: ['@el-negocio/ui', '@el-negocio/tool-sales-notes'],
  outputFileTracingRoot: REPO_ROOT,
  turbopack: { root: REPO_ROOT },

  // El navegador habla solo con este front (mismo origen): /api y /files se
  // reenvían al contenedor del API. Así no hay CORS ni cookies entre dominios,
  // y el API no necesita estar expuesto a internet.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` },
      { source: '/files/:path*', destination: `${API_ORIGIN}/files/:path*` },
    ];
  },

  images: {
    // Optimizador de imágenes de Next (reescala/convierte). Usa `sharp`, un binario
    // precompilado que exige un CPU con SSE4.2 (x86-64-v2). En CPUs viejos (p. ej.
    // Core 2 Duo) el proceso muere con "Illegal instruction" y el contenedor se
    // reinicia en bucle (502 en /_next/image).
    //   IMAGE_OPTIMIZATION=true  → activado (servidores modernos / producción)
    //   cualquier otro valor     → desactivado: las imágenes se sirven tal cual desde /files
    // Se fija al COMPILAR. Ver docs/DEPLOY-COOLIFY.md ("Pasar a producción").
    unoptimized: process.env.IMAGE_OPTIMIZATION !== 'true',
  },
};

export default nextConfig;
