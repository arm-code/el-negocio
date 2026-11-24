import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

// Origen del API para los rewrites. En el stack de Docker es el contenedor `api`;
// en desarrollo, el API local. Se fija al compilar.
const API_ORIGIN = process.env.INTERNAL_API_ORIGIN ?? (isProd ? 'http://api:3500' : 'http://localhost:3500');

const nextConfig: NextConfig = {
  // Imagen de Docker mínima: copia solo lo necesario para `node server.js`
  output: 'standalone',

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
    // Sin optimizador de imágenes de Next. Usa `sharp` (binario precompilado que exige
    // un CPU con SSE4.2 / x86-64-v2): en procesadores viejos (p. ej. Core 2 Duo) el
    // proceso muere con "Illegal instruction" y el contenedor se reinicia en bucle.
    // Las imágenes se sirven tal cual desde /files (caché larga, Cloudflare las cachea).
    unoptimized: true,
  },
};

export default nextConfig;
