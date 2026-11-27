export { formatCurrency } from '@el-negocio/ui/display'

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso?: string | null): string {
  if (!iso) return ''
  // Fecha sin hora: forzar mediodía local para evitar desfases de zona horaria
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateFmt.format(date)
}

export function genId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
}
