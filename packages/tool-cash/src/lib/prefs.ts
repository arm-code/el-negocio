// Comodidades de captura: recuerda la última forma de pago y las categorías
// recientes. Solo guarda ids en el navegador; si se pierden, no pasa nada.

import type { MovementKind } from '../types'

const KEY = 'el-negocio:cash-prefs:v1'
const REMEMBERED = 6

export interface Prefs {
  methodId?: string
  recent?: Partial<Record<MovementKind, string[]>>
}

export function readPrefs(): Prefs {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Prefs) : {}
  } catch {
    return {}
  }
}

export function rememberUse(kind: MovementKind, categoryId: string, methodId: string) {
  try {
    const prefs = readPrefs()
    const recent = (prefs.recent?.[kind] ?? []).filter((id) => id !== categoryId)
    const next: Prefs = {
      methodId,
      recent: { ...prefs.recent, [kind]: [categoryId, ...recent].slice(0, REMEMBERED) },
    }
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Sin almacenamiento (modo privado) el formulario funciona igual, sin recordar
  }
}
