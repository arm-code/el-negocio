// Respaldo de los datos que el sitio gratuito guarda en el navegador: sirve para no
// perderlos al cambiar de celular, de dirección web o al borrar el navegador.
//
// El archivo que se carga viene de fuera: se valida campo por campo y solo se
// copian los campos conocidos.

import { LIMITS as AGENDA_LIMITS } from '@el-negocio/tool-agenda'
import type { BusinessInfo, Note, NoteItem } from '@el-negocio/tool-sales-notes'
import { LIMITS, type CatalogItem } from '@el-negocio/tool-cash'
import { readAgendaData, writeAgendaData, type StoredEvent } from '@/lib/agenda-storage'
import { readCashData, sameName, writeCashData, type StoredMovement } from '@/lib/cash-storage'
import { readLocalData, writeLocalData } from '@/lib/sales-notes-storage'

const APP_ID = 'el-negocio'
const VERSION = 1
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_NOTES = 5000
const MAX_ITEMS = 500
const MAX_MOVEMENTS = 20_000
const MAX_OPTIONS = 500
const MAX_EVENTS = 20_000
const MAX_TEXT = 2000

/** Error con un mensaje que se le puede mostrar a la persona. */
export class BackupError extends Error {}

export interface ImportSummary {
  added: number
  updated: number
  /** Registros del archivo que no se pudieron leer. */
  invalid: number
}

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown, max = MAX_TEXT) => (typeof v === 'string' ? v.slice(0, max) : '')
const optionalText = (v: unknown, max = MAX_TEXT) => text(v, max) || undefined
const number = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

function parseItem(v: unknown): NoteItem | null {
  if (!isObject(v) || !text(v.id, 100)) return null
  return {
    id: text(v.id, 100),
    description: text(v.description),
    quantity: number(v.quantity),
    unitPrice: number(v.unitPrice),
  }
}

function parseNote(v: unknown): Note | null {
  if (!isObject(v) || !text(v.id, 100) || !isDate(v.createdAt)) return null
  if (!Array.isArray(v.items) || v.items.length > MAX_ITEMS) return null
  const items = v.items.map(parseItem)
  if (items.some((item) => item === null)) return null
  const customer = isObject(v.customer) ? v.customer : {}

  return {
    id: text(v.id, 100),
    folio: text(v.folio, 30),
    customer: {
      name: text(customer.name, 200),
      phone: optionalText(customer.phone, 40),
      address: optionalText(customer.address, 300),
    },
    items: items as NoteItem[],
    applyIva: v.applyIva === true,
    ivaRate: number(v.ivaRate, 0.16),
    notes: optionalText(v.notes),
    status: v.status === 'quote' ? 'quote' : 'issued',
    createdAt: v.createdAt,
    updatedAt: isDate(v.updatedAt) ? v.updatedAt : undefined,
  }
}

function parseOption(v: unknown): CatalogItem | null {
  if (!isObject(v) || !text(v.id, 100) || !text(v.name, LIMITS.optionName).trim()) return null
  return { id: text(v.id, 100), name: text(v.name, LIMITS.optionName).trim() }
}

function parseMovement(v: unknown): StoredMovement | null {
  if (!isObject(v) || !text(v.id, 100) || !isDate(v.createdAt)) return null
  const amount = number(v.amount)
  const date = text(v.date, 10)
  if (!(amount > 0 && amount <= LIMITS.maxAmount) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isDate(date)) return null
  if (v.kind !== 'in' && v.kind !== 'out') return null
  if (!text(v.categoryId, 100) || !text(v.methodId, 100)) return null

  return {
    id: text(v.id, 100),
    kind: v.kind,
    amount: Math.round(amount * 100) / 100,
    date,
    categoryId: text(v.categoryId, 100),
    methodId: text(v.methodId, 100),
    description: optionalText(v.description, LIMITS.description),
    eventId: optionalText(v.eventId, 100),
    createdAt: v.createdAt,
    updatedAt: isDate(v.updatedAt) ? v.updatedAt : undefined,
  }
}

function parseEvent(v: unknown): StoredEvent | null {
  if (!isObject(v) || !text(v.id, 100) || !isDate(v.createdAt)) return null
  const title = text(v.title, AGENDA_LIMITS.title).trim()
  const date = text(v.date, 10)
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isDate(date)) return null
  const { status } = v
  if (status !== 'pending' && status !== 'delivered' && status !== 'done' && status !== 'cancelled') return null
  const time = text(v.time, 5)
  const total = Math.round(number(v.total) * 100) / 100

  return {
    id: text(v.id, 100),
    title,
    date,
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : undefined,
    clientName: optionalText(v.clientName, AGENDA_LIMITS.clientName),
    clientPhone: optionalText(v.clientPhone, AGENDA_LIMITS.clientPhone),
    place: optionalText(v.place, AGENDA_LIMITS.place),
    notes: optionalText(v.notes, AGENDA_LIMITS.notes),
    total: total > 0 && total <= AGENDA_LIMITS.maxAmount ? total : undefined,
    needsReturn: v.needsReturn === true,
    guarantee: optionalText(v.guarantee, AGENDA_LIMITS.guarantee),
    status,
    createdAt: v.createdAt,
    updatedAt: isDate(v.updatedAt) ? v.updatedAt : undefined,
  }
}

const lastChange = (item: { createdAt: string; updatedAt?: string }) => Date.parse(item.updatedAt ?? item.createdAt)
const folioNumber = (note: Note) => Number(/(\d+)$/.exec(note.folio)?.[1] ?? 0)

/**
 * Suma las opciones del archivo a las del dispositivo. Si dos se llaman igual con
 * distinto id (creadas en dos celulares), se queda la de aquí y `alias` dice a cuál
 * deben apuntar los movimientos importados.
 */
function mergeOptions(current: CatalogItem[], incoming: unknown) {
  const items = [...current]
  const alias = new Map<string, string>()
  const entries = Array.isArray(incoming) ? incoming.slice(0, MAX_OPTIONS) : []
  for (const option of entries.map(parseOption)) {
    if (!option || items.some((i) => i.id === option.id)) continue
    const twin = items.find((i) => sameName(i.name, option.name))
    if (twin) alias.set(option.id, twin.id)
    else items.push(option)
  }
  return { items, alias }
}

/** Suma las entradas y salidas del archivo. `null` si no trae (respaldos anteriores). */
function mergeCash(incoming: unknown, summary: ImportSummary) {
  if (!isObject(incoming) || !Array.isArray(incoming.movements)) return null
  if (incoming.movements.length > MAX_MOVEMENTS) throw new BackupError('El respaldo tiene demasiados registros.')

  const current = readCashData()
  const categories = mergeOptions(current.categories, incoming.categories)
  const methods = mergeOptions(current.methods, incoming.methods)
  const byId = new Map(current.movements.map((m) => [m.id, m]))

  for (const entry of incoming.movements) {
    const movement = parseMovement(entry)
    if (!movement) {
      summary.invalid++
      continue
    }
    const existing = byId.get(movement.id)
    if (!existing) summary.added++
    else if (lastChange(movement) > lastChange(existing)) summary.updated++
    else continue
    byId.set(movement.id, {
      ...movement,
      categoryId: categories.alias.get(movement.categoryId) ?? movement.categoryId,
      methodId: methods.alias.get(movement.methodId) ?? movement.methodId,
    })
  }

  return { movements: [...byId.values()], categories: categories.items, methods: methods.items }
}

/** Suma la agenda del archivo. `null` si no trae (respaldos anteriores). */
function mergeAgenda(incoming: unknown, summary: ImportSummary) {
  if (!Array.isArray(incoming)) return null
  if (incoming.length > MAX_EVENTS) throw new BackupError('El respaldo tiene demasiados registros.')

  const byId = new Map(readAgendaData().map((e) => [e.id, e]))
  for (const entry of incoming) {
    const event = parseEvent(entry)
    if (!event) {
      summary.invalid++
      continue
    }
    const existing = byId.get(event.id)
    if (!existing) summary.added++
    else if (lastChange(event) > lastChange(existing)) summary.updated++
    else continue
    byId.set(event.id, event)
  }
  return [...byId.values()]
}

export function createBackup() {
  const data = readLocalData()
  const cash = readCashData()
  const agenda = readAgendaData()
  const exportedAt = new Date()
  const day = exportedAt.toLocaleDateString('en-CA') // AAAA-MM-DD en hora local
  return {
    fileName: `el-negocio-respaldo-${day}.json`,
    noteCount: data.salesNotes.length,
    movementCount: cash.movements.length,
    eventCount: agenda.length,
    content: JSON.stringify({ app: APP_ID, version: VERSION, exportedAt: exportedAt.toISOString(), ...data, cash, agenda }),
  }
}

/**
 * Suma el respaldo a lo que ya hay, sin borrar nada: agrega lo que falta y, si algo
 * está en ambos lados, se queda con lo modificado más recientemente.
 */
export async function importBackup(file: File): Promise<ImportSummary> {
  if (file.size > MAX_FILE_BYTES) throw new BackupError('El archivo es demasiado grande para ser un respaldo.')

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new BackupError('Ese archivo no es un respaldo de El Negocio.')
  }
  if (!isObject(parsed) || parsed.app !== APP_ID || !Array.isArray(parsed.salesNotes)) {
    throw new BackupError('Ese archivo no es un respaldo de El Negocio.')
  }
  if (parsed.version !== VERSION) {
    throw new BackupError('Este respaldo se hizo con otra versión. Actualiza la página e inténtalo de nuevo.')
  }
  if (parsed.salesNotes.length > MAX_NOTES) throw new BackupError('El respaldo tiene demasiadas notas.')

  const current = readLocalData()
  const byId = new Map(current.salesNotes.map((note) => [note.id, note]))
  const summary: ImportSummary = { added: 0, updated: 0, invalid: 0 }

  for (const entry of parsed.salesNotes) {
    const note = parseNote(entry)
    if (!note) {
      summary.invalid++
      continue
    }
    const existing = byId.get(note.id)
    if (!existing) summary.added++
    else if (lastChange(note) > lastChange(existing)) summary.updated++
    else continue
    byId.set(note.id, note)
  }

  let cash: ReturnType<typeof mergeCash>
  let agenda: ReturnType<typeof mergeAgenda>
  try {
    cash = mergeCash(parsed.cash, summary)
    agenda = mergeAgenda(parsed.agenda, summary)
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw new BackupError('No se pudo leer lo que ya tienes guardado en este dispositivo.')
  }
  const salesNotes = [...byId.values()]
  const info: Json = isObject(parsed.businessInfo) ? parsed.businessInfo : {}
  const imported: BusinessInfo = { name: text(info.name, 200), phone: text(info.phone, 40) }
  const hasOwnInfo = Boolean(current.businessInfo.name || current.businessInfo.phone)

  try {
    writeLocalData({
      salesNotes,
      // El siguiente folio no puede repetir uno que ya exista
      seq: Math.max(current.seq, number(parsed.seq), ...salesNotes.map(folioNumber)),
      businessInfo: hasOwnInfo ? current.businessInfo : imported,
    })
    if (cash) writeCashData(cash)
    if (agenda) writeAgendaData(agenda)
  } catch {
    throw new BackupError('No se pudo guardar. Revisa que tu navegador permita guardar datos y tenga espacio.')
  }

  return summary
}
