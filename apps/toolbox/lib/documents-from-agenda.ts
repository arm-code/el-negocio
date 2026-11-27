// Une la agenda con los documentos: lo anotado sirve para no volver a teclearlo. Las
// micro-apps no se conocen entre sí; la traducción es de la aplicación.

import type { DocumentSeed } from '@el-negocio/tool-documents'
import { readAgendaData } from '@/lib/agenda-storage'
import { readCashData } from '@/lib/cash-storage'

export function seedFromAgenda(eventId: string): DocumentSeed | undefined {
  try {
    const event = readAgendaData().find((e) => e.id === eventId)
    if (!event) return undefined
    const paid = readCashData()
      .movements.filter((m) => m.eventId === eventId && m.kind === 'in')
      .reduce((sum, m) => sum + Math.round(m.amount * 100), 0)
    const total = event.total ? String(event.total) : undefined

    return {
      eventId,
      values: {
        clientName: event.clientName,
        clientPhone: event.clientPhone,
        place: event.place,
        description: event.title,
        serviceDate: event.date,
        deliveryDate: event.date,
        guarantee: event.guarantee,
        amount: total,
        advance: total && paid ? String(Math.min(paid / 100, event.total!)) : undefined,
      },
    }
  } catch {
    // Con los datos dañados se empieza en blanco; la agenda avisa del problema
    return undefined
  }
}
