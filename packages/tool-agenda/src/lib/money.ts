// Cuentas del cobro, en centavos para no arrastrar decimales.

import type { AgendaEvent, Payment } from '../types'

export const sumPayments = (payments: Payment[]) =>
  payments.reduce((sum, p) => sum + Math.round(p.amount * 100), 0) / 100

/** Lo que falta por cobrar. 0 si no hay total o ya se cubrió. */
export function amountDue({ total, paid }: Pick<AgendaEvent, 'total' | 'paid'>): number {
  if (!total) return 0
  return Math.max(0, Math.round(total * 100) - Math.round(paid * 100)) / 100
}
