// Une la agenda con los documentos: lo anotado sirve para no volver a teclearlo. Las
// micro-apps no se conocen entre sí; la traducción es de la aplicación.

import type { DocumentSeed } from '@el-negocio/tool-documents'
import { apiEventsStorage } from '@/lib/agenda-storage'

export async function seedFromAgenda(eventId: string): Promise<DocumentSeed | null> {
  const event = await apiEventsStorage.get(eventId)
  if (!event) return null
  const total = event.total ? String(event.total) : undefined

  return {
    eventId,
    values: {
      clientName: event.clientName,
      clientPhone: event.clientPhone,
      place: event.place,
      description: event.title,
      serviceDate: event.date || undefined,
      deliveryDate: event.date || undefined,
      guarantee: event.guarantee,
      amount: total,
      advance: total && event.paid ? String(Math.min(event.paid, event.total!)) : undefined,
    },
  }
}
