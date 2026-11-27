// Adaptador de entradas y salidas para el toolbox: todo se guarda en localStorage.
//
// IMPORTANTE: cuando haya usuarios, las claves y el formato no se pueden cambiar.

import type {
  CatalogItem,
  CatalogKind,
  CatalogStorage,
  Movement,
  MovementKind,
  MovementsStorage,
  Period,
} from '@el-negocio/tool-cash'

const MOVEMENTS_KEY = 'el-negocio:cash:movements:v1'
const CATALOG_KEYS: Record<CatalogKind, string> = {
  category: 'el-negocio:cash:categories:v1',
  method: 'el-negocio:cash:methods:v1',
}
const PAGE_SIZE = 30

/** Opciones con las que empieza cualquiera. Sus ids son iguales en todos los dispositivos. */
const DEFAULTS: Record<CatalogKind, CatalogItem[]> = {
  category: [
    { id: 'cat-ventas', name: 'Ventas' },
    { id: 'cat-compras', name: 'Compras' },
    { id: 'cat-sueldos', name: 'Sueldos' },
    { id: 'cat-transporte', name: 'Transporte' },
    { id: 'cat-servicios', name: 'Servicios' },
    { id: 'cat-otros', name: 'Otros' },
  ],
  method: [
    { id: 'met-efectivo', name: 'Efectivo' },
    { id: 'met-transferencia', name: 'Transferencia' },
    { id: 'met-tarjeta', name: 'Tarjeta' },
  ],
}

/** Como se guarda: las opciones van por id. */
export interface StoredMovement {
  id: string
  kind: MovementKind
  amount: number
  date: string
  categoryId: string
  methodId: string
  description?: string
  createdAt: string
  updatedAt?: string
}

/**
 * Lee una lista guardada. Si está dañada, falla en vez de devolver vacío: así el
 * siguiente guardado no la sobrescribe.
 */
function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Los datos guardados están dañados')
  return parsed as T[]
}

function write(key: string, value: unknown) {
  // Puede lanzar (modo privado / cuota llena); quien llama lo convierte en error de UI
  window.localStorage.setItem(key, JSON.stringify(value))
}

const newId = (prefix: string) =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

/** Para comparar nombres sin importar mayúsculas ni acentos. */
export const sameName = (a: string, b: string) => a.trim().localeCompare(b.trim(), 'es', { sensitivity: 'base' }) === 0

const readMovements = () => readList<StoredMovement>(MOVEMENTS_KEY, [])
const readCatalog = (kind: CatalogKind) => readList<CatalogItem>(CATALOG_KEYS[kind], DEFAULTS[kind])

/** Del día más reciente al más antiguo; en el mismo día, lo último capturado primero. */
const newestFirst = (a: StoredMovement, b: StoredMovement) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)

const inPeriod = (movement: StoredMovement, period: Period | null) =>
  !period || (movement.date >= period.from && movement.date <= period.to)

/** Convierte los ids guardados en las opciones con su nombre. */
function resolver() {
  const find = (items: CatalogItem[], id: string) => items.find((i) => i.id === id) ?? { id, name: 'Sin nombre' }
  const categories = readCatalog('category')
  const methods = readCatalog('method')
  return ({ categoryId, methodId, ...movement }: StoredMovement): Movement => ({
    ...movement,
    category: find(categories, categoryId),
    method: find(methods, methodId),
  })
}

/** Todo lo que esta herramienta guarda en el dispositivo (para respaldar). */
export function readCashData() {
  return {
    movements: readMovements(),
    categories: readCatalog('category'),
    methods: readCatalog('method'),
  }
}

/** Reemplaza los datos locales. Los movimientos van primero: es lo que puede no caber. */
export function writeCashData(data: ReturnType<typeof readCashData>) {
  write(MOVEMENTS_KEY, data.movements)
  write(CATALOG_KEYS.category, data.categories)
  write(CATALOG_KEYS.method, data.methods)
}

export const localMovementsStorage: MovementsStorage = {
  async list(period, page) {
    const chosen = readMovements()
      .filter((m) => inPeriod(m, period))
      .sort(newestFirst)
    const end = page * PAGE_SIZE
    return {
      items: chosen.slice(end - PAGE_SIZE, end).map(resolver()),
      nextPage: chosen.length > end ? page + 1 : null,
    }
  },

  async summary(period) {
    // En centavos para que la suma no arrastre decimales
    const cents = { in: 0, out: 0 }
    for (const m of readMovements()) {
      if (inPeriod(m, period)) cents[m.kind] += Math.round(m.amount * 100)
    }
    return { in: cents.in / 100, out: cents.out / 100 }
  },

  async get(id) {
    const found = readMovements().find((m) => m.id === id)
    return found ? resolver()(found) : null
  },

  async create(input) {
    const stored: StoredMovement = { ...input, id: newId('mv'), createdAt: new Date().toISOString() }
    write(MOVEMENTS_KEY, [stored, ...readMovements()])
    return resolver()(stored)
  },

  async update(id, input) {
    const movements = readMovements()
    const current = movements.find((m) => m.id === id)
    if (!current) throw new Error('Movimiento no encontrado')
    const updated: StoredMovement = {
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    write(MOVEMENTS_KEY, movements.map((m) => (m.id === id ? updated : m)))
    return resolver()(updated)
  },

  async remove(id) {
    write(MOVEMENTS_KEY, readMovements().filter((m) => m.id !== id))
  },

  subscribe(onChange) {
    // El evento `storage` solo llega cuando escribe OTRA pestaña
    const onStorage = (e: StorageEvent) => {
      if (e.key === MOVEMENTS_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}

export const localCatalogStorage: CatalogStorage = {
  async list(kind) {
    return readCatalog(kind)
  },

  async create(kind, name) {
    const items = readCatalog(kind)
    const existing = items.find((i) => sameName(i.name, name))
    if (existing) return existing
    const item = { id: newId(kind === 'category' ? 'cat' : 'met'), name: name.trim() }
    write(CATALOG_KEYS[kind], [...items, item])
    return item
  },
}
