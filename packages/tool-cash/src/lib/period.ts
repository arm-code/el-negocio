// Meses del calendario, en la hora local del dispositivo.

import { capitalize, toLocalDateInput } from '@el-negocio/ui/display'
import type { Period } from '../types'

export interface Month {
  year: number
  /** 0 = enero. */
  month: number
}

export function currentMonth(): Month {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

/** El mes de una fecha AAAA-MM-DD. */
export function monthOf(date: string): Month {
  const [year, month] = date.split('-').map(Number)
  return { year, month: month - 1 }
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const moved = new Date(year, month + delta, 1)
  return { year: moved.getFullYear(), month: moved.getMonth() }
}

/** Negativo si `a` es anterior a `b`, 0 si son el mismo mes. */
export function compareMonths(a: Month, b: Month): number {
  return a.year - b.year || a.month - b.month
}

export function monthPeriod({ year, month }: Month): Period {
  return {
    from: toLocalDateInput(new Date(year, month, 1)),
    // Día 0 del mes siguiente = último día de este
    to: toLocalDateInput(new Date(year, month + 1, 0)),
  }
}

const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long' })

/** "Noviembre 2026" */
export function monthLabel({ year, month }: Month): string {
  return `${capitalize(monthName.format(new Date(year, month, 1)))} ${year}`
}

/** "noviembre", con el año si no es el actual. */
export function monthInSentence({ year, month }: Month): string {
  const name = monthName.format(new Date(year, month, 1))
  return year === new Date().getFullYear() ? name : `${name} de ${year}`
}
