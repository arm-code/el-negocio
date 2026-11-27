// Cómo guarda El Negocio OS la agenda: en los eventos del API del negocio. Los cobros
// son entradas de dinero ligadas al evento. Aquí se traduce entre los nombres de la
// micro-app (@el-negocio/tool-agenda) y los del API.

import {
  LIMITS,
  type AgendaEvent,
  type EventInput,
  type EventStatus,
  type EventsStorage,
  type PaymentsStorage,
} from '@el-negocio/tool-agenda'
import { ApiError, axiosInstance } from '@/lib/api/axios'
import { financeApi } from '@/lib/api/finance'
import { getAllPages } from '@/lib/api/pagination'
import type { BusinessEvent, EventStatus as ApiStatus, Transaction } from '@/types/finance'

const PATH = '/v1/events'
const MOVEMENTS_PATH = '/v1/transactions'
/** El máximo que admite el API en la descripción de un movimiento. */
const DESCRIPTION_MAX = 255

const eventPath = (id: string) => `${PATH}/${encodeURIComponent(id)}`

const FROM_API: Record<ApiStatus, EventStatus> = {
  pending: 'pending',
  delivered: 'delivered',
  collected: 'done',
  cancelled: 'cancelled',
}

export const TO_API: Record<EventStatus, ApiStatus> = {
  pending: 'pending',
  delivered: 'delivered',
  done: 'collected',
  cancelled: 'cancelled',
}

function toEvent(e: BusinessEvent): AgendaEvent {
  const cost = Number(e.cost ?? 0)
  return {
    id: e.id,
    folio: e.folio || undefined,
    title: e.name || 'Sin nombre',
    // Vacía, no "hoy": la pantalla dice "Sin fecha"
    date: e.eventDate?.slice(0, 10) ?? '',
    time: e.eventTime || undefined,
    clientName: e.clientName || undefined,
    clientPhone: e.clientPhone || undefined,
    place: e.eventAddress || undefined,
    notes: e.notes || undefined,
    total: cost > 0 ? cost : undefined,
    paid: Number(e.paidAmount ?? 0),
    needsReturn: e.needsReturn === true,
    guarantee: e.guaranteeDocument || undefined,
    status: (e.status && FROM_API[e.status]) || 'pending',
    createdAt: e.createdAt ?? '',
    updatedAt: e.updatedAt,
  }
}

/**
 * `null` borra lo vaciado; si no se enviara, el API conservaría lo anterior. La nota de
 * venta ligada no se captura aquí: al no enviarla, se conserva.
 */
function toPayload(input: EventInput) {
  return {
    name: input.title,
    eventDate: input.date,
    eventTime: input.time ?? null,
    clientName: input.clientName ?? null,
    clientPhone: input.clientPhone ?? null,
    eventAddress: input.place ?? null,
    notes: input.notes ?? null,
    cost: input.total ?? 0,
    needsReturn: input.needsReturn,
    guaranteeDocument: input.guarantee ?? null,
  }
}

export const apiEventsStorage: EventsStorage = {
  // También se agenda desde otros dispositivos
  staleTime: 0,

  async list() {
    const events = await getAllPages<BusinessEvent>(PATH, { isActive: true })
    return events.map(toEvent)
  },

  async get(id) {
    try {
      const { data } = await axiosInstance.get<BusinessEvent>(eventPath(id))
      return data.isActive === false ? null : toEvent(data)
    } catch (error) {
      // 400: el id ni siquiera tiene forma de id
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
      throw error
    }
  },

  async create(input) {
    const { data } = await axiosInstance.post<BusinessEvent>(PATH, toPayload(input))
    return toEvent(data)
  },

  async update(id, input) {
    const { data } = await axiosInstance.patch<BusinessEvent>(eventPath(id), toPayload(input))
    return toEvent(data)
  },

  async setStatus(id, status) {
    const { data } = await axiosInstance.patch<BusinessEvent>(`${eventPath(id)}/status`, { status: TO_API[status] })
    return toEvent(data)
  },

  async remove(id) {
    // El API no borra eventos: se ocultan, y sus movimientos de dinero se conservan
    await axiosInstance.patch(eventPath(id), { isActive: false })
  },
}

/**
 * Con qué categoría entra el cobro: lo que se devuelve es una renta; lo demás, una venta.
 * Si el negocio no tiene esas, "Otros" o la primera que haya.
 */
async function paymentCategory(event: AgendaEvent) {
  const active = (await financeApi.getCategories()).filter((c) => c.isActive !== false)
  const preferred = event.needsReturn ? ['RENTA', 'VENTAS', 'OTROS'] : ['VENTAS', 'OTROS']
  const found = preferred.map((code) => active.find((c) => c.code === code)).find(Boolean) ?? active[0]
  if (!found) throw new Error('No hay categorías para anotar el cobro')
  return found.id
}

export const apiPaymentsStorage: PaymentsStorage = {
  async methods() {
    const first = (code?: string) => (code === 'CASH' ? 0 : 1)
    return (await financeApi.getPaymentMethods())
      .filter((m) => m.isActive !== false)
      .sort((a, b) => first(a.code) - first(b.code) || a.name.localeCompare(b.name, 'es'))
      .map(({ id, name }) => ({ id, name }))
  },

  async list(eventId) {
    const movements = await getAllPages<Transaction>(MOVEMENTS_PATH, { businessEventId: eventId, type: 'INPUT' })
    return movements
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
      .map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        date: t.transactionDate.slice(0, 10),
        method: t.paymentMethod.name,
      }))
  },

  async record(event, { amount, date, methodId }) {
    const description = [event.title, event.clientName].filter(Boolean).join(' · ')
    await axiosInstance.post(MOVEMENTS_PATH, {
      type: 'INPUT',
      amount,
      transactionDate: date,
      paymentMethodId: methodId,
      categoryId: await paymentCategory(event),
      businessEventId: event.id,
      description: description.slice(0, Math.min(DESCRIPTION_MAX, LIMITS.title + LIMITS.clientName)),
    })
  },
}
