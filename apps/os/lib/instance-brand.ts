// Identidad de esta instancia, para el título de las pestañas y la app instalable.
// Una instancia = un negocio: se muestra SU nombre y SU logo. "El Negocio OS" solo
// aparece mientras la instancia aún no tiene negocio configurado.
// Solo para código de servidor.

import { connection } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/base-url';

export const PLATFORM_NAME = 'El Negocio OS';

export interface InstanceBrand {
  /** Nombre del negocio; `null` si aún no hay o el API no responde. */
  name: string | null;
  logoUrl: string | null;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function getInstanceBrand(): Promise<InstanceBrand> {
  // Se resuelve en cada petición: al compilar la imagen no existe el API
  await connection();

  try {
    const res = await fetch(`${getApiBaseUrl()}/v1/businesses/public`, {
      next: { revalidate: 600 },
      // El login debe responder aunque el API esté caído (lo usa el healthcheck)
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { name: null, logoUrl: null };

    const body = await res.json();
    const data = body?.data ?? body;
    return {
      name: text(data?.name) || text(data?.config?.name) || null,
      logoUrl: text(data?.logoUrl) || text(data?.config?.logoUrl) || null,
    };
  } catch {
    return { name: null, logoUrl: null };
  }
}
