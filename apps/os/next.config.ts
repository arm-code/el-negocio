import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

// Origen del API para los rewrites. En el stack de Docker es el contenedor `api`;
// en desarrollo, el API local. Se fija al compilar.
const API_ORIGIN = process.env.INTERNAL_API_ORIGIN ?? (isProd ? 'http://api:3500' : 'http://localhost:3500');

// Solo si NEXT_PUBLIC_API_BASE_URL es absoluta (desarrollo con el API en otro puerto).
// En producción las imágenes son rutas relativas (/files/...) y no necesitan patrón.
function apiImagePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  try {
    const api = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? '');
    return [
      {
        protocol: api.protocol.replace(':', '') as 'http' | 'https',
        hostname: api.hostname,
        port: api.port,
        pathname: '/files/**',
      },
    ];
  } catch {
    return [];
  }
}

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
    remotePatterns: apiImagePatterns(),
    // En local el API está en localhost (IP privada): Next lo bloquea por defecto
    dangerouslyAllowLocalIP: !isProd,
  },
};

export default nextConfig;
