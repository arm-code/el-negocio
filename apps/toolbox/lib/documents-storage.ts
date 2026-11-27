// Adaptador de contratos y pagarés para el toolbox: todo se guarda en localStorage.
//
// IMPORTANTE: cuando haya usuarios, las claves y el formato no se pueden cambiar.

import type { BusinessDocument, DocumentsStorage, DocumentValues } from '@el-negocio/tool-documents'
import { readLocalData } from '@/lib/sales-notes-storage'

const DOCUMENTS_KEY = 'el-negocio:documents:v1'
const SEQ_KEY = 'el-negocio:documents:seq'

/**
 * Lee lo guardado. Si está dañado, falla en vez de devolver vacío: así el siguiente
 * guardado no lo sobrescribe.
 */
function readDocuments(): BusinessDocument[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(DOCUMENTS_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Los datos guardados están dañados')
  return parsed as BusinessDocument[]
}

/** El último folio usado: un folio borrado no se vuelve a dar. */
function readSeq(): number {
  if (typeof window === 'undefined') return 0
  return Number(window.localStorage.getItem(SEQ_KEY)) || 0
}

export const readDocumentsData = () => ({ documents: readDocuments(), seq: readSeq() })

export function writeDocumentsData({ documents, seq }: ReturnType<typeof readDocumentsData>) {
  // Puede lanzar (modo privado / cuota llena); quien llama lo convierte en error de UI
  window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
  window.localStorage.setItem(SEQ_KEY, String(seq))
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `doc-${crypto.randomUUID()}`
    : `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

/** El nombre y teléfono que ya se pusieron en las notas de venta. */
export async function businessDefaults(): Promise<DocumentValues> {
  const { name, phone } = readLocalData().businessInfo
  return { ownerName: name || undefined, ownerPhone: phone || undefined }
}

export const localDocumentsStorage: DocumentsStorage = {
  staleTime: 0,

  async list() {
    return readDocuments()
  },

  async get(id) {
    return readDocuments().find((d) => d.id === id) ?? null
  },

  async create(input) {
    const { documents, seq } = readDocumentsData()
    const folio = Math.max(seq, ...documents.map((d) => d.folio), 0) + 1
    const document: BusinessDocument = { ...input, id: newId(), folio, createdAt: new Date().toISOString() }
    writeDocumentsData({ documents: [document, ...documents], seq: folio })
    return document
  },

  async update(id, input) {
    const { documents, seq } = readDocumentsData()
    const current = documents.find((d) => d.id === id)
    if (!current) throw new Error('No se encontró el documento')
    const updated: BusinessDocument = {
      ...input,
      id: current.id,
      folio: current.folio,
      eventId: current.eventId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    writeDocumentsData({ documents: documents.map((d) => (d.id === id ? updated : d)), seq })
    return updated
  },

  async remove(id) {
    const { documents, seq } = readDocumentsData()
    // El folio queda usado
    writeDocumentsData({
      documents: documents.filter((d) => d.id !== id),
      seq: Math.max(seq, ...documents.map((d) => d.folio), 0),
    })
  },

  subscribe(onChange) {
    // El evento `storage` solo llega cuando escribe OTRA pestaña
    const onStorage = (e: StorageEvent) => {
      if (e.key === DOCUMENTS_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}
