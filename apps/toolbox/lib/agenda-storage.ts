// Adaptador de la agenda para el toolbox: todo se guarda en localStorage.
//
// IMPORTANTE: cuando haya usuarios, la clave y el formato no se pueden cambiar.

import type { AgendaEvent, EventsStorage } from '@el-negocio/tool-agenda'

const EVENTS_KEY = 'el-negocio:agenda:events:v1'

/**
 * Lee lo guardado. Si está dañado, falla en vez de devolver vacío: así el siguiente
 * guardado no lo sobrescribe.
 */
export function readAgendaData(): AgendaEvent[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(EVENTS_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Los datos guardados están dañados')
  return parsed as AgendaEvent[]
}

export function writeAgendaData(events: AgendaEvent[]) {
  // Puede lanzar (modo privado / cuota llena); quien llama lo convierte en error de UI
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `ev-${crypto.randomUUID()}`
    : `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

/** Aplica un cambio a un registro que ya existe y lo guarda. */
function change(id: string, apply: (current: AgendaEvent) => AgendaEvent) {
  const events = readAgendaData()
  const current = events.find((e) => e.id === id)
  if (!current) throw new Error('No se encontró en la agenda')
  const updated = { ...apply(current), updatedAt: new Date().toISOString() }
  writeAgendaData(events.map((e) => (e.id === id ? updated : e)))
  return updated
}

export const localEventsStorage: EventsStorage = {
  async list() {
    return readAgendaData()
  },

  async get(id) {
    return readAgendaData().find((e) => e.id === id) ?? null
  },

  async create(input) {
    const event: AgendaEvent = { ...input, id: newId(), status: 'pending', createdAt: new Date().toISOString() }
    writeAgendaData([event, ...readAgendaData()])
    return event
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
    writeAgendaData(readAgendaData().filter((e) => e.id !== id))
  },

  subscribe(onChange) {
    // El evento `storage` solo llega cuando escribe OTRA pestaña
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVENTS_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}
