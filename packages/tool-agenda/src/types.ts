// Tipos de dominio de la micro-app de agenda.
//
// Solo son obligatorios qué es y cuándo: todo lo demás depende de lo que cada quien
// necesite anotar.

export type EventStatus = 'pending' | 'done' | 'cancelled'

export interface AgendaEvent {
  id: string
  title: string
  /** Día, AAAA-MM-DD. */
  date: string
  /** Hora, HH:mm (24 horas). Sin hora, es "durante el día". */
  time?: string
  clientName?: string
  clientPhone?: string
  place?: string
  notes?: string
  status: EventStatus
  createdAt: string // ISO
  updatedAt?: string // ISO
}

/** Datos para agendar o corregir (el id, el estado y las fechas los pone el storage). */
export type EventInput = Pick<
  AgendaEvent,
  'title' | 'date' | 'time' | 'clientName' | 'clientPhone' | 'place' | 'notes'
>
