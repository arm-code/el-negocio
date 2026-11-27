// Tipos de dominio de la micro-app de entradas y salidas.

export type MovementKind = 'in' | 'out'

/** Opción de un catálogo: una categoría o una forma de pago. */
export interface CatalogItem {
  id: string
  name: string
}

export type CatalogKind = 'category' | 'method'

export interface Movement {
  id: string
  kind: MovementKind
  /** En pesos, mayor que 0 y con dos decimales como máximo. */
  amount: number
  /** Día del movimiento, AAAA-MM-DD. */
  date: string
  category: CatalogItem
  method: CatalogItem
  description?: string
  createdAt: string // ISO
  updatedAt?: string // ISO
}

/** Datos para anotar o corregir un movimiento (el id y las fechas los pone el storage). */
export interface MovementInput {
  kind: MovementKind
  amount: number
  date: string
  categoryId: string
  methodId: string
  description?: string
}

/** Rango de días, ambos incluidos (AAAA-MM-DD). */
export interface Period {
  from: string
  to: string
}

export interface Totals {
  in: number
  out: number
}

export interface MovementsPage {
  items: Movement[]
  /** `null` cuando no hay más. */
  nextPage: number | null
}
