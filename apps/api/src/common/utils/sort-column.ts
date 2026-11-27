/**
 * Campo por el que se ordena un listado. `sortBy` llega de la URL y termina dentro
 * de la consulta SQL sin parámetros, así que solo se aceptan los campos de la lista:
 * cualquier otro valor ordena por el primero.
 */
export function sortColumn<T extends string>(
  requested: string | undefined,
  allowed: readonly [T, ...T[]],
): T {
  return allowed.find((column) => column === requested) ?? allowed[0];
}
