// Cómo se dice y se ordena el "cuándo" de lo agendado, en la hora del dispositivo.

import { describeDate, toLocalDateInput } from '@el-negocio/ui/display'
import type { AgendaEvent } from '../types'

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

/** Las pestañas: lo entregado sigue pendiente hasta que regresa. */
export type Tab = 'pending' | 'done' | 'cancelled'

export const tabOf = (event: AgendaEvent): Tab => (event.status === 'delivered' ? 'pending' : event.status)

export interface Group {
  key: string
  label: string
  /** Pendientes de días que ya pasaron: el encabezado no dice qué día. */
  late?: boolean
  items: AgendaEvent[]
}

const LATE = {
  unreturned: { label: 'Falta que lo devuelvan', order: 0 },
  late: { label: 'Se pasó la fecha', order: 1 },
}

/**
 * Pendientes: lo atrasado junto y arriba (primero lo que no ha regresado), luego por
 * día. Hechos y cancelados: del más reciente al más antiguo.
 */
export function groupEvents(events: AgendaEvent[], tab: Tab): Group[] {
  const today = dayFromToday(0)
  const lateKind = (event: AgendaEvent) => {
    // Sin fecha no está atrasado
    if (tab !== 'pending' || !event.date || event.date >= today) return null
    return event.status === 'delivered' ? 'unreturned' : 'late'
  }
  const rank = (event: AgendaEvent) => {
    const kind = lateKind(event)
    return kind ? LATE[kind].order : 2
  }

  const sorted = [...events].sort(chronological)
  // El orden por rango es estable: dentro de cada uno se conserva el cronológico
  if (tab === 'pending') sorted.sort((a, b) => rank(a) - rank(b))
  else sorted.reverse()

  const groups: Group[] = []
  for (const event of sorted) {
    const kind = lateKind(event)
    const key = kind ?? event.date
    let group = groups.at(-1)
    if (group?.key !== key) {
      group = { key, label: kind ? LATE[kind].label : dayName(event.date), late: Boolean(kind), items: [] }
      groups.push(group)
    }
    group.items.push(event)
  }
  return groups
}
