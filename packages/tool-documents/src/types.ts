// Tipos de dominio de la micro-app de contratos y pagarés.

export const DOCUMENT_KINDS = ['promissory', 'promissory-rental', 'sale', 'service', 'rental'] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

/** Todo lo que se puede llenar. Cada formato usa una parte. */
export const FIELD_KEYS = [
  // Quien hace el documento
  'ownerName',
  'ownerAddress',
  'ownerPhone',
  'city',
  'jurisdiction',
  // Cliente
  'clientName',
  'clientAddress',
  'clientPhone',
  'clientId',
  // Operación
  'date',
  'amount',
  'advance',
  'dueDate',
  'interest',
  'description',
  'paymentTerms',
  'serviceDate',
  'place',
  'deliveryDate',
  'returnDate',
  'warranty',
  'guarantee',
  'cancellation',
  'lateFee',
  'claimDays',
  'observations',
  // Aval
  'guarantorName',
  'guarantorAddress',
] as const
export type FieldKey = (typeof FIELD_KEYS)[number]

/** Los valores se guardan como texto: cantidades "1500.50", días "AAAA-MM-DD". */
export type DocumentValues = Partial<Record<FieldKey, string>>

/** Un renglón de la relación de artículos. */
export interface DocumentItem {
  quantity: number
  description: string
  /** Lo que vale cada uno si hay que reponerlo. 0 si no se indica. */
  unitValue: number
}

export interface BusinessDocument {
  id: string
  /** Consecutivo del negocio; lo asigna el almacenamiento. */
  folio: number
  kind: DocumentKind
  values: DocumentValues
  items: DocumentItem[]
  /** Lo agendado de donde salió, si salió de ahí. */
  eventId?: string
  createdAt: string // ISO
  updatedAt?: string // ISO
}

export type DocumentInput = Pick<BusinessDocument, 'kind' | 'values' | 'items' | 'eventId'>

/** Datos con los que empieza uno nuevo, p. ej. al hacerlo desde la agenda. */
export interface DocumentSeed {
  values?: DocumentValues
  items?: DocumentItem[]
  eventId?: string
}
