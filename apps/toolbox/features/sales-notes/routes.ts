// Rutas de la micro-app. Si se mueve la herramienta, solo se cambia aquí.
const BASE = '/tools/sales-note'

export const SALES_NOTES_ROUTES = {
  list: BASE,
  create: `${BASE}/new`,
  // El id va como parámetro para que la pantalla sea estática y abra sin red.
  edit: (id: string) => `${BASE}/edit?id=${encodeURIComponent(id)}`,
} as const
