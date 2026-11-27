// Cómo guarda El Negocio OS los contratos y pagarés: en el API del negocio. Implementa
// el contrato de la micro-app (@el-negocio/tool-documents).

import type {
  BusinessDocument,
  DocumentInput,
  DocumentsStorage,
  DocumentValues,
} from '@el-negocio/tool-documents'
import { ApiError, axiosInstance } from '@/lib/api/axios'
import { financeApi } from '@/lib/api/finance'
import { getAllPages } from '@/lib/api/pagination'

const PATH = '/v1/documents'

const documentPath = (id: string) => `${PATH}/${encodeURIComponent(id)}`

/** Como lo responde el API: el evento sin ligar llega como `null`. */
type ApiDocument = Omit<BusinessDocument, 'eventId'> & { eventId: string | null }

const toDocument = ({ eventId, ...document }: ApiDocument): BusinessDocument => ({
  ...document,
  eventId: eventId ?? undefined,
})

/** Folio y evento no se envían al corregir: el API los conserva. */
const toPayload = ({ kind, values, items }: DocumentInput) => ({ kind, values, items })

export const apiDocumentsStorage: DocumentsStorage = {
  // También se hacen desde otros dispositivos
  staleTime: 0,

  async list() {
    return (await getAllPages<ApiDocument>(PATH)).map(toDocument)
  },

  async get(id) {
    try {
      const { data } = await axiosInstance.get<ApiDocument>(documentPath(id))
      return toDocument(data)
    } catch (error) {
      // 400: el id ni siquiera tiene forma de id
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null
      throw error
    }
  },

  async create(input) {
    const { data } = await axiosInstance.post<ApiDocument>(PATH, { ...toPayload(input), eventId: input.eventId })
    return toDocument(data)
  },

  async update(id, input) {
    const { data } = await axiosInstance.patch<ApiDocument>(documentPath(id), toPayload(input))
    return toDocument(data)
  },

  async remove(id) {
    await axiosInstance.delete(documentPath(id))
  },
}

/** Los datos del negocio ya capturados en los ajustes. */
export async function businessDefaults(): Promise<DocumentValues> {
  const config = await financeApi.getConfig()
  return {
    ownerName: config.name || undefined,
    ownerAddress: config.address || undefined,
    ownerPhone: config.phone || undefined,
  }
}
