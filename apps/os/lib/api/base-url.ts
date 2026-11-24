/**
 * URL base del API según dónde corra el código.
 *
 * - Navegador: NEXT_PUBLIC_API_BASE_URL. En producción es relativa ("/api"): el
 *   propio front reenvía /api al contenedor del API (ver rewrites en next.config.ts).
 * - Servidor (SSR): una URL relativa no sirve, así que se usa INTERNAL_API_URL
 *   (p. ej. "http://api:3500/api", por la red interna de Docker).
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || '';
}
