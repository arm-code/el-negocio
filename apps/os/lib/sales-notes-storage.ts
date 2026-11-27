// Cómo guarda El Negocio OS las notas de venta: en el API del negocio. Implementa
// los contratos de la micro-app (@el-negocio/tool-sales-notes) y traduce entre sus
// nombres y los del API.

import type { BusinessInfoStorage, Note, NoteInput, NotesStorage } from '@el-negocio/tool-sales-notes'
import { ApiError, axiosInstance } from '@/lib/api/axios'
import { financeApi } from '@/lib/api/finance'
import type { PaginatedResponse, SalesNote } from '@/types/finance'

const PATH = '/v1/sales-notes'
/** El máximo que acepta el API por página. */
const PAGE_SIZE = 100

const notePath = (id: string) => `${PATH}/${encodeURIComponent(id)}`

function toNote(note: SalesNote): Note {
  return {
    id: note.id,
    folio: note.folio,
    customer: {
      name: note.customerName,
      phone: note.customerPhone || undefined,
      address: note.customerAddress || undefined,
    },
    items: note.items.map((item) => ({
      id: item.id,
      description: item.concept,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
    applyIva: note.applyIva,
    ivaRate: Number(note.ivaRate),
    notes: note.notes || undefined,
    status: note.status === 'quote' ? 'quote' : 'issued',
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

// El correo del cliente y el evento vinculado no se capturan aquí: al no enviarlos,
// el API conserva los que ya tenga la nota.
function toPayload(input: NoteInput) {
  return {
    status: input.status === 'quote' ? 'quote' : 'note',
    customerName: input.customer.name,
    // null borra el dato; si no se enviara, el API conservaría el anterior
    customerPhone: input.customer.phone || null,
    customerAddress: input.customer.address || null,
    notes: input.notes || null,
    applyIva: input.applyIva,
    ivaRate: input.ivaRate,
    items: input.items.map((item) => ({
      concept: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }
}

export const apiNotesStorage: NotesStorage = {
  // Las notas también cambian desde otros dispositivos
  staleTime: 0,

  async list() {
    const notes: Note[] = []
    let page = 1
    let hasNextPage = true
    while (hasNextPage) {
      const { data } = await axiosInstance.get<PaginatedResponse<SalesNote>>(PATH, {
        params: { page, limit: PAGE_SIZE },
      })
      notes.push(...data.items.map(toNote))
      hasNextPage = data.meta.hasNextPage
      page++
    }
    return notes
  },

  async get(id) {
    try {
      const { data } = await axiosInstance.get<SalesNote>(notePath(id))
      return toNote(data)
    } catch (error) {
      // 400: el id de la dirección ni siquiera tiene forma de id
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
      throw error
    }
  },

  async create(input) {
    const { data } = await axiosInstance.post<SalesNote>(PATH, toPayload(input))
    return toNote(data)
  },

  async update(id, input) {
    const { data } = await axiosInstance.patch<SalesNote>(notePath(id), toPayload(input))
    return toNote(data)
  },

  async remove(id) {
    await axiosInstance.delete(notePath(id))
  },
}

// Solo lectura (sin `save`): los datos del negocio se editan en Configuración.
export const apiBusinessInfoStorage: BusinessInfoStorage = {
  staleTime: 0,

  async get() {
    const config = await financeApi.getConfig()
    return { name: config.name ?? '', phone: config.phone ?? '' }
  },
}
