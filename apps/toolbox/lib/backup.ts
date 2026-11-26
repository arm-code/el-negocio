// Respaldo de los datos que el sitio gratuito guarda en el navegador: sirve para no
// perderlos al cambiar de celular, de dirección web o al borrar el navegador.
//
// El archivo que se carga viene de fuera: se valida campo por campo y solo se
// copian los campos conocidos.

import type { BusinessInfo, Note, NoteItem } from '@/features/sales-notes'
import { readLocalData, writeLocalData } from '@/lib/sales-notes-storage'

const APP_ID = 'el-negocio'
const VERSION = 1
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_NOTES = 5000
const MAX_ITEMS = 500
const MAX_TEXT = 2000

/** Error con un mensaje que se le puede mostrar a la persona. */
export class BackupError extends Error {}

export interface ImportSummary {
  added: number
  updated: number
  /** Entradas del archivo que no eran notas válidas. */
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

const lastChange = (note: Note) => Date.parse(note.updatedAt ?? note.createdAt)
const folioNumber = (note: Note) => Number(/(\d+)$/.exec(note.folio)?.[1] ?? 0)

export function createBackup() {
  const data = readLocalData()
  const exportedAt = new Date()
  const day = exportedAt.toLocaleDateString('en-CA') // AAAA-MM-DD en hora local
  return {
    fileName: `el-negocio-respaldo-${day}.json`,
    noteCount: data.salesNotes.length,
    content: JSON.stringify({ app: APP_ID, version: VERSION, exportedAt: exportedAt.toISOString(), ...data }),
  }
}

/**
 * Suma el respaldo a lo que ya hay, sin borrar nada: agrega las notas que faltan y,
 * si una está en ambos lados, se queda con la modificada más recientemente.
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
  } catch {
    throw new BackupError('No se pudo guardar. Revisa que tu navegador permita guardar datos y tenga espacio.')
  }

  return summary
}
