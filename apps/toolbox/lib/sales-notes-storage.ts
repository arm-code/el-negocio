// Adaptador de las notas de venta para el toolbox: todo se guarda en localStorage.
//
// IMPORTANTE: las claves y el formato son los que ya tienen los usuarios en su
// navegador. Cambiarlos hace que dejen de ver sus notas.

import { genId, type BusinessInfo, type BusinessInfoStorage, type Note, type NotesStorage } from '@/features/sales-notes'

const NOTES_KEY = 'bt:sales-notes:v1'
const SEQ_KEY = 'bt:sales-notes:seq'
const BUSINESS_KEY = 'bt:business-info:v1'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  // Puede lanzar (modo privado / cuota llena); quien llama lo convierte en error de UI
  window.localStorage.setItem(key, JSON.stringify(value))
}

function nextFolio(): string {
  const seq = read<number>(SEQ_KEY, 0) + 1
  write(SEQ_KEY, seq)
  return `NV-${String(seq).padStart(4, '0')}`
}

/** Notas guardadas, de la más reciente a la más antigua. */
function readNotes(): Note[] {
  const notes = read<Note[]>(NOTES_KEY, [])
  if (!Array.isArray(notes)) return []
  return [...notes].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
}

/** Todo lo que las notas de venta guardan en este dispositivo (para respaldar). */
export function readLocalData() {
  return {
    salesNotes: readNotes(),
    seq: read<number>(SEQ_KEY, 0),
    businessInfo: { name: '', phone: '', ...read<Partial<BusinessInfo>>(BUSINESS_KEY, {}) },
  }
}

/** Reemplaza los datos locales. Las notas van primero: es lo que puede no caber. */
export function writeLocalData(data: ReturnType<typeof readLocalData>) {
  write(NOTES_KEY, data.salesNotes)
  write(SEQ_KEY, data.seq)
  write(BUSINESS_KEY, data.businessInfo)
}

export const localNotesStorage: NotesStorage = {
  async list() {
    return readNotes()
  },

  async get(id) {
    return readNotes().find((n) => n.id === id) ?? null
  },

  async create(input) {
    const note: Note = { ...input, id: genId('nv'), folio: nextFolio(), createdAt: new Date().toISOString() }
    write(NOTES_KEY, [note, ...readNotes()])
    return note
  },

  async update(id, input) {
    const notes = readNotes()
    const current = notes.find((n) => n.id === id)
    if (!current) throw new Error('Nota no encontrada')
    const updated: Note = {
      ...input,
      id: current.id,
      folio: current.folio,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    write(NOTES_KEY, notes.map((n) => (n.id === id ? updated : n)))
    return updated
  },

  async remove(id) {
    write(NOTES_KEY, readNotes().filter((n) => n.id !== id))
  },

  subscribe(onChange) {
    // El evento `storage` solo llega cuando escribe OTRA pestaña
    const onStorage = (e: StorageEvent) => {
      if (e.key === NOTES_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}

export const localBusinessInfoStorage: BusinessInfoStorage = {
  async get() {
    return { name: '', phone: '', ...read<Partial<BusinessInfo>>(BUSINESS_KEY, {}) }
  },

  async save(info) {
    write(BUSINESS_KEY, info)
    return info
  },
}
