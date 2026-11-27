import { axiosInstance } from './axios';
import type { PaginatedResponse } from '@/types/finance';

/** El máximo que acepta el API por página. */
const PAGE_SIZE = 100;

/**
 * Trae completa una lista del API, que sin `limit` solo entrega 10 elementos.
 *
 * Pagina por `id` porque no se repite: ordenando por fecha de alta, dos elementos
 * con la misma fecha pueden salir repetidos o quedarse fuera entre dos páginas.
 * El resultado va del más reciente al más antiguo, como lo entrega el API.
 */
export async function getAllPages<T extends { id: string; createdAt?: string }>(
  path: string,
  /** Filtros que admita el listado. */
  filters?: Record<string, string | boolean>
): Promise<T[]> {
  // Por id: un alta a media descarga recorre las páginas y puede repetir un elemento
  const items = new Map<string, T>();
  let page = 1;
  let hasNextPage = true;
  while (hasNextPage) {
    const { data } = await axiosInstance.get<PaginatedResponse<T>>(path, {
      params: { ...filters, page, limit: PAGE_SIZE, sortBy: 'id', sortOrder: 'ASC' },
    });
    for (const item of data.items) items.set(item.id, item);
    hasNextPage = data.meta.hasNextPage;
    page++;
  }
  return [...items.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}
