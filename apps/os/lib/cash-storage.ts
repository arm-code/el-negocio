// Cómo guarda El Negocio OS las entradas y salidas: en el API del negocio. Implementa
// los contratos de la micro-app (@el-negocio/tool-cash) y traduce entre sus nombres
// y los del API.

import type {
  CatalogItem,
  CatalogKind,
  CatalogStorage,
  Movement,
  MovementInput,
  MovementsStorage,
  Period,
} from '@el-negocio/tool-cash'
import { ApiError, axiosInstance } from '@/lib/api/axios'
import { financeApi } from '@/lib/api/finance'
import { codeFromName } from '@/lib/catalog-code'
import { normalizeSearch } from '@/lib/display'
import type { PaginatedResponse, Transaction } from '@/types/finance'

const PATH = '/v1/transactions'
const PAGE_SIZE = 30

const movementPath = (id: string) => `${PATH}/${encodeURIComponent(id)}`
const periodParams = (period: Period | null) => (period ? { dateFrom: period.from, dateTo: period.to } : {})

function toMovement(t: Transaction): Movement {
  return {
    id: t.id,
    kind: t.type === 'INPUT' ? 'in' : 'out',
    amount: Number(t.amount),
    date: t.transactionDate.slice(0, 10),
    category: { id: t.category.id, name: t.category.name },
    method: { id: t.paymentMethod.id, name: t.paymentMethod.name },
    description: t.description || undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

function toPayload(input: MovementInput) {
  return {
    type: input.kind === 'in' ? 'INPUT' : 'OUTPUT',
    amount: input.amount,
    transactionDate: input.date,
  }
}

async function fetchTransaction(id: string) {
  const { data } = await axiosInstance.get<Transaction>(movementPath(id))
  return data
}

export const apiMovementsStorage: MovementsStorage = {
  // También se anotan desde otros dispositivos
  staleTime: 0,

  async list(period, page) {
    // El API desempata por folio, así las páginas no repiten ni pierden movimientos
    const { data } = await axiosInstance.get<PaginatedResponse<Transaction>>(PATH, {
      params: { page, limit: PAGE_SIZE, sortBy: 'transactionDate', sortOrder: 'DESC', ...periodParams(period) },
    })
    return { items: data.items.map(toMovement), nextPage: data.meta.hasNextPage ? page + 1 : null }
  },

  async summary(period) {
    const { data } = await axiosInstance.get<{ totalInputs: number; totalOutputs: number }>(`${PATH}/summary`, {
      params: periodParams(period),
    })
    return { in: Number(data.totalInputs), out: Number(data.totalOutputs) }
  },

  async get(id) {
    try {
      return toMovement(await fetchTransaction(id))
    } catch (error) {
      // 400: el id ni siquiera tiene forma de id
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
      throw error
    }
  },

  async create(input) {
    const { data } = await axiosInstance.post<Transaction>(PATH, {
      ...toPayload(input),
      categoryId: input.categoryId,
      paymentMethodId: input.methodId,
      description: input.description,
    })
    return toMovement(data)
  },

  async update(id, input) {
    // El API rechaza una categoría o forma de pago desactivada: solo se envían si cambian.
    // El evento vinculado no se captura aquí: al no enviarlo, se conserva.
    const current = await fetchTransaction(id)
    const { data } = await axiosInstance.patch<Transaction>(movementPath(id), {
      ...toPayload(input),
      ...(input.categoryId !== current.category.id && { categoryId: input.categoryId }),
      ...(input.methodId !== current.paymentMethod.id && { paymentMethodId: input.methodId }),
      // null borra el detalle; si no se enviara, el API conservaría el anterior
      description: input.description ?? null,
    })
    return toMovement(data)
  },

  async remove(id) {
    await axiosInstance.delete(movementPath(id))
  },
}

interface ApiOption {
  id: string
  code?: string
  name: string
  isActive?: boolean
}

const listOptions = (kind: CatalogKind): Promise<ApiOption[]> =>
  kind === 'category' ? financeApi.getCategories() : financeApi.getPaymentMethods()

/** "Otros" (o "Efectivo") primero, que es lo que queda preelegido; el resto por nombre. */
const FIRST_CODE: Record<CatalogKind, string> = { category: 'OTROS', method: 'CASH' }

const toItem = ({ id, name }: ApiOption): CatalogItem => ({ id, name })

export const apiCatalogStorage: CatalogStorage = {
  staleTime: 0,

  async list(kind) {
    const options = await listOptions(kind)
    const first = (o: ApiOption) => (o.code === FIRST_CODE[kind] ? 0 : 1)
    return options
      .filter((o) => o.isActive !== false)
      .sort((a, b) => first(a) - first(b) || a.name.localeCompare(b.name, 'es'))
      .map(toItem)
  },

  async create(kind, name) {
    const wanted = normalizeSearch(name.trim())
    const existing = (await listOptions(kind)).find((o) => normalizeSearch(o.name.trim()) === wanted)
    if (existing && existing.isActive !== false) return toItem(existing)

    const payload = { code: codeFromName(name), name: name.trim(), isActive: true }
    const created =
      kind === 'category' ? await financeApi.createCategory(payload) : await financeApi.createPaymentMethod(payload)
    return toItem(created)
  },
}
