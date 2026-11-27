// Contrato que cada aplicación implementa para guardar los datos de la micro-app.
// La micro-app no sabe si detrás hay localStorage, un API u otra cosa.

import type { AgendaEvent, EventInput, EventStatus } from './types'

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
