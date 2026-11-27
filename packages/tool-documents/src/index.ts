// API pública de la micro-app de contratos y pagarés.
// La aplicación que la usa solo debe importar desde aquí.

export { DocumentsHome } from './components/documents-home'
export { LinkedDocuments } from './components/linked-documents'
export { DocumentsProvider } from './provider'
export type { DocumentsConfig, DocumentsRoutes, DocumentsCopy } from './provider'
export type { DocumentsStorage } from './ports'
export { LIMITS } from './lib/limits'
export { folioText } from './lib/format'
export { documentAmount, templateName } from './lib/templates'
export { DOCUMENT_KINDS, FIELD_KEYS } from './types'
export type {
  BusinessDocument,
  DocumentInput,
  DocumentItem,
  DocumentKind,
  DocumentSeed,
  DocumentValues,
  FieldKey,
} from './types'
