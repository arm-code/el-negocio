// Cómo se dice y se ordena el "cuándo" de lo agendado, en la hora del dispositivo.

import { describeDate, toLocalDateInput } from '@el-negocio/ui/display'
import type { AgendaEvent, EventStatus } from '../types'

export function dayFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toLocalDateInput(date)
}

/** "Hoy", "Mañana", "Ayer" o "Sábado 5 de diciembre". */
export function dayName(date: string): string {
  if (date === dayFromToday(0)) return 'Hoy'
  if (date === dayFromToday(1)) return 'Mañana'
  if (date === dayFromToday(-1)) return 'Ayer'
  return describeDate(date, { dateOnly: true })?.label ?? 'Sin fecha'
}

const timeFormat = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' })

/** "16:30" → "4:30 p.m." */
export function timeName(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return time
  return timeFormat.format(new Date(2000, 0, 1, hours, minutes))
}

/** Del más temprano al más tarde; en un mismo día, primero lo que no tiene hora. */
const chronological = (a: AgendaEvent, b: AgendaEvent) =>
  a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '') || a.createdAt.localeCompare(b.createdAt)

export interface Group {
  key: string
  label: string
  /** Pendientes de días que ya pasaron. */
  late?: boolean
  items: AgendaEvent[]
}

/**
 * Pendientes: lo atrasado junto y arriba, luego por día. Hechos y cancelados: del más
 * reciente al más antiguo.
 */
export function groupEvents(events: AgendaEvent[], status: EventStatus): Group[] {
  const today = dayFromToday(0)
  const sorted = [...events].sort(chronological)
  if (status !== 'pending') sorted.reverse()

  const groups: Group[] = []
  for (const event of sorted) {
    const late = status === 'pending' && event.date < today
    const key = late ? 'late' : event.date
    let group = groups.at(-1)
    if (group?.key !== key) {
      group = { key, label: late ? 'Se pasó la fecha' : dayName(event.date), late, items: [] }
      groups.push(group)
    }
    group.items.push(event)
  }
  return groups
}
