'use client'

// Dirección de acceso directo: abre la agenda ya en la captura.
import { AgendaHome } from '@el-negocio/tool-agenda'
import { AgendaExtras } from '@/components/events/agenda-extras'

export default function AgendarPage() {
  return <AgendaHome startNew renderExtra={(event) => <AgendaExtras event={event} />} />
}
