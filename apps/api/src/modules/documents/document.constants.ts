/**
 * Formatos y datos que acepta un documento. Deben coincidir con los de la micro-app
 * (packages/tool-documents): lo que no esté aquí se rechaza.
 */
export const DOCUMENT_KINDS = [
  'promissory',
  'promissory-rental',
  'sale',
  'service',
  'rental',
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_FIELDS = [
  'ownerName',
  'ownerAddress',
  'ownerPhone',
  'city',
  'jurisdiction',
  'clientName',
  'clientAddress',
  'clientPhone',
  'clientId',
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
  'guarantorName',
  'guarantorAddress',
] as const;

export const DOCUMENT_LIMITS = {
  text: 2000,
  items: 100,
  itemDescription: 200,
  maxQuantity: 100_000,
  maxAmount: 10_000_000,
} as const;
