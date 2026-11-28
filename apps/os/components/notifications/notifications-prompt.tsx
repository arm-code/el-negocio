'use client'

import Link from 'next/link'
import { BellRing, ChevronRight } from 'lucide-react'
import { usePushState } from './notifications-card'

/** Recordatorio en el inicio, solo mientras este celular pueda activarlos y no lo haya hecho. */
export function NotificationsPrompt() {
  const { data } = usePushState()
  if (data !== 'off' && data !== 'ios-install') return null

  return (
    <Link
      href="/avisos"
      className="flex min-h-16 items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 outline-none transition-colors hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <BellRing className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">Activa los avisos en este celular</span>
        <span className="block text-sm text-muted-foreground">Para que no se te pase nada de la agenda.</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}
