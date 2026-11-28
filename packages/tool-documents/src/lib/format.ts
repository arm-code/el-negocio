// Cómo se escriben fechas, folios y cantidades dentro de un documento.

import { formatCurrency, parseDate } from '@el-negocio/ui/display'
import type { DocumentItem } from '../types'

/** Espacio para llenar a mano lo que no se capturó. */
export const BLANK = '______________________'

const longDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

/** "27 de noviembre de 2026", o el espacio en blanco. */
export function dateText(value?: string): string {
  const date = parseDate(value, { dateOnly: true })
  return date ? longDate.format(date) : BLANK
}

export const folioText = (folio: number) => String(folio).padStart(4, '0')

export const moneyText = (value: number) => formatCurrency(value)

export const lineValue = (item: DocumentItem) => Math.round(item.quantity * item.unitValue * 100) / 100

/** Suma en centavos para no arrastrar decimales. */
export const itemsTotal = (items: DocumentItem[]) =>
  items.reduce((sum, item) => sum + Math.round(lineValue(item) * 100), 0) / 100
