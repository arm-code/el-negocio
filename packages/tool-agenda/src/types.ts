// Tipos de dominio de la micro-app de agenda.
//
// Solo son obligatorios qué es y cuándo: todo lo demás depende de lo que cada quien
// necesite anotar.

/** `delivered`: ya se entregó y falta que regrese (solo lo que lleva devolución). */
export type EventStatus = 'pending' | 'delivered' | 'done' | 'cancelled'

export interface AgendaEvent {
  id: string
  /** Número visible, si el almacenamiento lo asigna (p. ej. "EV-0007"). */
  folio?: string
  title: string
  /** Día, AAAA-MM-DD. */
  date: string
  /** Hora, HH:mm (24 horas). Sin hora, es "durante el día". */
  time?: string
  clientName?: string
  clientPhone?: string
  place?: string
  notes?: string
  /** Cuánto se va a cobrar. */
  total?: number
  /** Lo ya cobrado: lo calcula el almacenamiento con lo anotado en Caja para esto. */
  paid: number
  /** Algo se entrega y hay que recibirlo de vuelta. */
  needsReturn: boolean
  /** Lo que dejó el cliente: identificación, depósito… */
  guarantee?: string
  status: EventStatus
  createdAt: string // ISO
  updatedAt?: string // ISO
}

/** Datos para agendar o corregir (el id, el estado y las fechas los pone el storage). */
export type EventInput = Pick<
  AgendaEvent,
  | 'title'
  | 'date'
  | 'time'
  | 'clientName'
  | 'clientPhone'
  | 'place'
  | 'notes'
  | 'total'
  | 'needsReturn'
  | 'guarantee'
>

/** Un cobro ya anotado en Caja para algo agendado. */
export interface Payment {
  id: string
  amount: number
  /** Día, AAAA-MM-DD. */
  date: string
  /** Nombre de la forma de pago. */
  method: string
}

export interface PaymentMethodOption {
  id: string
  name: string
}

export interface PaymentInput {
  amount: number
  date: string
  methodId: string
}
