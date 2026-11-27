'use client'

import { AgendaHome } from '@el-negocio/tool-agenda'
import { AgendaExtras } from '@/components/events/agenda-extras'

export default function AgendaPage() {
  return <AgendaHome renderExtra={(event) => <AgendaExtras event={event} />} />
}
