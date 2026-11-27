// Contratos que cada aplicación implementa para guardar los datos de la micro-app.
// La micro-app no sabe si detrás hay localStorage, un API u otra cosa.

import type { CatalogItem, CatalogKind, Movement, MovementInput, MovementsPage, Period, Totals } from './types'

export interface MovementsStorage {
  /**
   * Milisegundos que los datos leídos se consideran vigentes. Si falta, siempre: solo
   * cambian desde esta app. Usa 0 si otro dispositivo o pantalla puede cambiarlos.
   */
  staleTime?: number
  /**
   * Una página, del día más reciente al más antiguo y en un orden fijo (así no se
   * repiten ni se pierden movimientos entre páginas). `page` empieza en 1; sin
   * `period` es todo el historial.
   */
  list(period: Period | null, page: number): Promise<MovementsPage>
  /** Cuánto entró y salió en el periodo; sin él, en todo el historial. */
  summary(period: Period | null): Promise<Totals>
  /** `null` si no existe. */
  get(id: string): Promise<Movement | null>
  /** El almacenamiento asigna id y fecha de captura. */
  create(input: MovementInput): Promise<Movement>
  /**
   * Reemplaza todos los datos editables: sin `description`, queda vacía. Lo que la
   * micro-app no captura (p. ej. un evento vinculado) se conserva. Falla si no existe.
   */
  update(id: string, input: MovementInput): Promise<Movement>
  remove(id: string): Promise<void>
  /** Avisa de cambios hechos por fuera (p. ej. otra pestaña). Devuelve cómo dejar de escuchar. */
  subscribe?(onChange: () => void): () => void
}

export interface CatalogStorage {
  /** Igual que en `MovementsStorage`. */
  staleTime?: number
  list(kind: CatalogKind): Promise<CatalogItem[]>
  /** Si ya hay una opción con ese nombre, devuelve esa. */
  create(kind: CatalogKind, name: string): Promise<CatalogItem>
}
