// Adaptador de la agenda para el toolbox: todo se guarda en localStorage. Los cobros de
// lo agendado son entradas de la Caja.
//
// IMPORTANTE: cuando haya usuarios, la clave y el formato no se pueden cambiar.

import type { AgendaEvent, EventsStorage, PaymentsStorage } from '@el-negocio/tool-agenda'
import { LIMITS as CASH_LIMITS } from '@el-negocio/tool-cash'
import { addEventPayment, MOVEMENTS_KEY, readCashData } from '@/lib/cash-storage'

const EVENTS_KEY = 'el-negocio:agenda:events:v1'
/** Categoría con la que entran los cobros; viene entre las que trae la app. */
const PAYMENT_CATEGORY = 'cat-ventas'

/** Como se guarda: lo cobrado no se guarda aquí, sale de la Caja. */
export type StoredEvent = Omit<AgendaEvent, 'paid'>

/**
 * Lee lo guardado. Si está dañado, falla en vez de devolver vacío: así el siguiente
 * guardado no lo sobrescribe.
 */
export function readAgendaData(): StoredEvent[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(EVENTS_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Los datos guardados están dañados')
  return parsed as StoredEvent[]
}

export function writeAgendaData(events: StoredEvent[]) {
  // Puede lanzar (modo privado / cuota llena); quien llama lo convierte en error de UI
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `ev-${crypto.randomUUID()}`
    : `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

/** Completa cada registro con lo cobrado según la Caja. */
function withPaid(events: StoredEvent[]): AgendaEvent[] {
  const cents = new Map<string, number>()
  for (const m of readCashData().movements) {
    if (m.eventId && m.kind === 'in') cents.set(m.eventId, (cents.get(m.eventId) ?? 0) + Math.round(m.amount * 100))
  }
  return events.map((event) => ({
    ...event,
    // Lo agendado antes de que existiera la devolución no la trae
    needsReturn: event.needsReturn === true,
    paid: (cents.get(event.id) ?? 0) / 100,
  }))
}

/** Aplica un cambio a un registro que ya existe y lo guarda. */
function change(id: string, apply: (current: StoredEvent) => StoredEvent) {
  const events = readAgendaData()
  const current = events.find((e) => e.id === id)
  if (!current) throw new Error('No se encontró en la agenda')
  const updated = { ...apply(current), updatedAt: new Date().toISOString() }
  writeAgendaData(events.map((e) => (e.id === id ? updated : e)))
  return withPaid([updated])[0]
}

export const localEventsStorage: EventsStorage = {
  // Un cobro corregido en la Caja cambia lo que falta: se lee de nuevo cada vez
  staleTime: 0,

  async list() {
    return withPaid(readAgendaData())
  },

  async get(id) {
    const found = readAgendaData().find((e) => e.id === id)
    return found ? withPaid([found])[0] : null
  },

  async create(input) {
    const event: StoredEvent = { ...input, id: newId(), status: 'pending', createdAt: new Date().toISOString() }
    writeAgendaData([event, ...readAgendaData()])
    return { ...event, paid: 0 }
  },

  async update(id, input) {
    return change(id, (current) => ({
      ...input,
      id: current.id,
      status: current.status,
      createdAt: current.createdAt,
    }))
  },

  async setStatus(id, status) {
    return change(id, (current) => ({ ...current, status }))
  },

  async remove(id) {
    // Lo ya cobrado se queda en la Caja: ese dinero sí entró
    writeAgendaData(readAgendaData().filter((e) => e.id !== id))
  },

  subscribe(onChange) {
    // El evento `storage` solo llega cuando escribe OTRA pestaña
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVENTS_KEY || e.key === MOVEMENTS_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}

export const localPaymentsStorage: PaymentsStorage = {
  async methods() {
    return readCashData().methods
  },

  async list(eventId) {
    const { movements, methods } = readCashData()
    return movements
      .filter((m) => m.eventId === eventId && m.kind === 'in')
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .map((m) => ({
        id: m.id,
        amount: m.amount,
        date: m.date,
        method: methods.find((method) => method.id === m.methodId)?.name ?? 'Sin nombre',
      }))
  },

  async record(event, { amount, date, methodId }) {
    const description = [event.title, event.clientName].filter(Boolean).join(' · ')
    addEventPayment(event.id, {
      kind: 'in',
      amount,
      date,
      methodId,
      categoryId: PAYMENT_CATEGORY,
      description: description.slice(0, CASH_LIMITS.description),
    })
  },
}
