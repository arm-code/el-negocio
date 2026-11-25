// Contratos que cada aplicación implementa para guardar los datos de la micro-app.
// La micro-app no sabe si detrás hay localStorage, un API u otra cosa.

import type { BusinessInfo, Note, NoteInput } from './types'

export interface NotesStorage {
  /** Todas las notas, de la más reciente a la más antigua. */
  list(): Promise<Note[]>
  /** `null` si no existe. */
  get(id: string): Promise<Note | null>
  /** El almacenamiento asigna id, folio y fecha de creación. */
  create(input: NoteInput): Promise<Note>
  /**
   * Reemplaza todos los datos editables: un campo opcional que no venga en `input`
   * queda vacío. Conserva id, folio y fecha de creación. Falla si la nota no existe.
   */
  update(id: string, input: NoteInput): Promise<Note>
  remove(id: string): Promise<void>
  /** Avisa de cambios hechos por fuera (p. ej. otra pestaña). Devuelve cómo dejar de escuchar. */
  subscribe?(onChange: () => void): () => void
}

export interface BusinessInfoStorage {
  /** Datos del negocio; cadenas vacías si aún no se han capturado. */
  get(): Promise<BusinessInfo>
  /** Si falta, los datos son de solo lectura y la micro-app no ofrece editarlos. */
  save?(info: BusinessInfo): Promise<BusinessInfo>
}
