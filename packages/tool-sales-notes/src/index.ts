// API pública de la micro-app de notas de venta.
// La aplicación que la usa solo debe importar desde aquí.

export { NotesHistory } from './components/notes-history'
export { NoteWizard } from './components/note-wizard'
export { EditNote } from './components/edit-note'
export { SalesNotesProvider } from './provider'
export type { SalesNotesConfig, SalesNotesRoutes, SalesNotesCopy } from './provider'
export type { NotesStorage, BusinessInfoStorage } from './ports'
export { genId } from './lib/format'
export type { Note, NoteInput, NoteItem, NoteStatus, BusinessInfo } from './types'
