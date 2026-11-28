// Contrato que cada aplicación implementa para guardar los datos de la micro-app.
// La micro-app no sabe si detrás hay localStorage, un API u otra cosa.

import type { AgendaEvent, EventInput, EventStatus, Payment, PaymentInput, PaymentMethodOption } from './types'

export interface EventsStorage {
  /**
   * Milisegundos que los datos leídos se consideran vigentes. Si falta, siempre: solo
   * cambian desde esta app. Usa 0 si otro dispositivo o pantalla puede cambiarlos.
   */
  staleTime?: number
  /**
   * Todos, en cualquier orden. Las pestañas y la búsqueda trabajan sobre la lista
   * completa: una agenda crece despacio (decenas de registros al mes).
   */
  list(): Promise<AgendaEvent[]>
  /** `null` si no existe. */
  get(id: string): Promise<AgendaEvent | null>
  /** El almacenamiento asigna id y fecha de captura; empieza pendiente. */
  create(input: EventInput): Promise<AgendaEvent>
  /**
   * Reemplaza los datos editables: un campo opcional que no venga queda vacío. Conserva
   * el estado y lo que la micro-app no captura. Falla si no existe.
   */
  update(id: string, input: EventInput): Promise<AgendaEvent>
  setStatus(id: string, status: EventStatus): Promise<AgendaEvent>
  remove(id: string): Promise<void>
  /** Avisa de cambios hechos por fuera (p. ej. otra pestaña). Devuelve cómo dejar de escuchar. */
  subscribe?(onChange: () => void): () => void
}

/**
 * Los cobros de lo agendado son entradas de dinero: la aplicación las anota en su Caja,
 * que es la única fuente de lo cobrado.
 */
export interface PaymentsStorage {
  /** Formas de pago disponibles, la que conviene preelegir primero. */
  methods(): Promise<PaymentMethodOption[]>
  /** Lo cobrado para algo agendado, de lo más reciente a lo más antiguo. */
  list(eventId: string): Promise<Payment[]>
  /** Anota el cobro como una entrada de dinero ligada a lo agendado. */
  record(event: AgendaEvent, payment: PaymentInput): Promise<void>
}
