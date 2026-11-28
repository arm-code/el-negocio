// Cómo se pregunta cada dato.

import type { FieldKey } from '../types'

export type FieldType = 'text' | 'long' | 'money' | 'date' | 'percent' | 'number' | 'phone'

export interface FieldInfo {
  label: string
  type: FieldType
  placeholder?: string
}

export const FIELDS: Record<FieldKey, FieldInfo> = {
  ownerName: { label: 'Tu nombre o el de tu negocio', type: 'text' },
  ownerAddress: { label: 'Tu domicilio', type: 'text', placeholder: 'Calle, número, colonia, C.P.' },
  ownerPhone: { label: 'Tu teléfono', type: 'phone' },
  city: { label: 'Ciudad y estado', type: 'text', placeholder: 'Ej. Ciudad Juárez, Chihuahua' },
  jurisdiction: { label: 'Tribunales de', type: 'text', placeholder: 'Si lo dejas vacío, los de tu ciudad' },
  clientName: { label: 'Nombre completo', type: 'text' },
  clientAddress: { label: 'Domicilio', type: 'text', placeholder: 'Calle, número, colonia, C.P.' },
  clientPhone: { label: 'Teléfono', type: 'phone' },
  clientId: { label: 'Identificación (tipo y folio)', type: 'text', placeholder: 'Ej. INE 1234567890' },
  date: { label: 'Fecha del documento', type: 'date' },
  amount: { label: 'Cantidad ($)', type: 'money' },
  advance: { label: 'Anticipo ($)', type: 'money' },
  dueDate: { label: 'Fecha de pago', type: 'date' },
  interest: { label: 'Interés por atraso (% al mes)', type: 'percent', placeholder: 'Ej. 5' },
  description: { label: 'Descripción', type: 'long' },
  paymentTerms: { label: 'Cómo se va a pagar', type: 'long', placeholder: 'Vacío: en un solo pago al firmar' },
  serviceDate: { label: 'Fecha del servicio o evento', type: 'date' },
  place: { label: 'Lugar', type: 'text' },
  deliveryDate: { label: 'Fecha de entrega', type: 'date' },
  returnDate: { label: 'Fecha de devolución', type: 'date' },
  warranty: { label: 'Garantía que das', type: 'text', placeholder: 'Ej. 30 días por defectos' },
  guarantee: { label: 'Garantía que deja el cliente', type: 'text', placeholder: 'Ej. INE, depósito de $500' },
  cancellation: { label: 'Si se cancela', type: 'long' },
  lateFee: { label: 'Cargo por cada día de retraso', type: 'text', placeholder: 'Ej. $200 o el 10% de la renta' },
  claimDays: { label: 'Días para pagar daños', type: 'number', placeholder: 'Ej. 5' },
  observations: { label: 'Observaciones', type: 'long' },
  guarantorName: { label: 'Nombre del aval', type: 'text' },
  guarantorAddress: { label: 'Domicilio del aval', type: 'text' },
}

/** Datos que casi nunca cambian: se toman del último documento. */
export const REMEMBERED: readonly FieldKey[] = [
  'ownerName',
  'ownerAddress',
  'ownerPhone',
  'city',
  'jurisdiction',
  'interest',
  'lateFee',
  'claimDays',
  'cancellation',
]
