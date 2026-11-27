// Contrato que cada aplicación implementa para guardar los documentos.

import type { BusinessDocument, DocumentInput } from './types'

export interface DocumentsStorage {
  /**
   * Milisegundos que los datos leídos se consideran vigentes. Si falta, siempre: solo
   * cambian desde esta app. Usa 0 si otro dispositivo o pantalla puede cambiarlos.
   */
  staleTime?: number
  /** Todos, en cualquier orden: se hacen pocos documentos al mes. */
  list(): Promise<BusinessDocument[]>
  /** `null` si no existe. */
  get(id: string): Promise<BusinessDocument | null>
  /** El almacenamiento asigna id, folio consecutivo y fecha de captura. */
  create(input: DocumentInput): Promise<BusinessDocument>
  /** Reemplaza lo capturado; conserva folio y lo agendado de donde salió. Falla si no existe. */
  update(id: string, input: DocumentInput): Promise<BusinessDocument>
  remove(id: string): Promise<void>
  /** Avisa de cambios hechos por fuera. Devuelve cómo dejar de escuchar. */
  subscribe?(onChange: () => void): () => void
}
