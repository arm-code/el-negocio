'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  CalendarPlus,
  CalendarX2,
  ChevronRight,
  FilePlus2,
  FileText,
  Plus,
  RotateCw,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { apiEventsStorage } from '@/lib/agenda-storage'
import type { AgendaEvent } from '@el-negocio/tool-agenda'
import { apiMovementsStorage } from '@/lib/cash-storage'
import { formatCurrency } from '@/lib/format'
import { PageHeader } from '@/components/admin/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileFab } from '@/components/ui/mobile-fab'
import { NotificationsPrompt } from '@/components/notifications/notifications-prompt'
import { cn } from '@/lib/utils'

/* ─── Tipos ─────────────────────────────────────────────────────────────── */

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
}

/* ─── Constantes ────────────────────────────────────────────────────────── */

const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: 'Nueva nota', href: '/tools/notas-venta/crear-nota-venta', icon: FilePlus2 },
  { label: 'Agendar', href: '/tools/eventos/crear-evento', icon: CalendarPlus },
  { label: 'Anotar entrada o salida', href: '/tools/finanzas', icon: ArrowLeftRight, adminOnly: true },
  { label: 'Ver notas', href: '/tools/notas-venta', icon: FileText },
]

// Allowlist: solo estos estados se muestran como "próximos"
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
}

const MAX_UPCOMING = 5

const dayFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('es-MX', { month: 'short' })

/* ─── Utilidades ────────────────────────────────────────────────────────── */

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * "2026-09-25" con new Date() se interpreta en UTC y en México se muestra
 * como el día anterior. Aquí se construye en hora local.
 */
function parseEventDate(value?: string | null): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getUpcoming(events: AgendaEvent[] = []): AgendaEvent[] {
  return events
    .filter((e) => e.status in STATUS_LABEL)
    .sort((a, b) => {
      const da = parseEventDate(a.date)?.getTime() ?? Infinity
      const db = parseEventDate(b.date)?.getTime() ?? Infinity
      return da - db || (a.time ?? '').localeCompare(b.time ?? '')
    })
    .slice(0, MAX_UPCOMING)
}

/* ─── Página ────────────────────────────────────────────────────────────── */

export default function PrincipalPage() {
  const { user, isAdmin } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0]

  const summaryQuery = useQuery({
    // Bajo 'cash' para que se refresque al anotar, corregir o borrar
    queryKey: ['cash', 'dashboard'],
    queryFn: () => apiMovementsStorage.summary(null),
    enabled: isAdmin,
  })

  const eventsQuery = useQuery({
    // Bajo 'agenda' para que se refresque al agendar, corregir o cobrar
    queryKey: ['agenda', 'dashboard'],
    queryFn: () => apiEventsStorage.list(),
    staleTime: 0,
  })

  const upcoming = getUpcoming(eventsQuery.data)

  return (
    <div className="space-y-8 pb-28 sm:pb-8">
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : 'Hola'}
        description={isAdmin ? 'Así va tu negocio.' : 'Esto es lo que hay por hacer.'}
      />

      <NotificationsPrompt />

      {/* Resumen */}
      {isAdmin && (
        <section aria-label="Resumen de dinero">
          {summaryQuery.isLoading ? (
            <SummarySkeleton />
          ) : summaryQuery.isError ? (
            <InlineError
              message="No se pudo cargar tu resumen."
              onRetry={() => summaryQuery.refetch()}
            />
          ) : (
            <SummaryCard
              // En centavos: restar decimales directamente deja colas
              balance={(Math.round(toNumber(summaryQuery.data?.in) * 100) - Math.round(toNumber(summaryQuery.data?.out) * 100)) / 100}
              inputs={toNumber(summaryQuery.data?.in)}
              outputs={toNumber(summaryQuery.data?.out)}
            />
          )}
        </section>
      )}

      {/* Accesos rápidos */}
      <section aria-labelledby="quick-actions-title" className="space-y-3">
        <h2 id="quick-actions-title" className="text-base font-semibold">
          ¿Qué quieres hacer?
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.filter((action) => isAdmin || !action.adminOnly).map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-24 flex-col justify-center items-center gap-3 rounded-xl border bg-card p-4',
                'transition-colors hover:bg-accent active:bg-accent',
                'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
              )}
            >
              <span className="text-center text-[15px] font-medium leading-snug">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Próximos eventos */}
      <section aria-labelledby="events-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="events-title" className="text-base font-semibold">
            Lo que sigue en tu agenda
          </h2>
          <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary">
            <Link href="/tools/eventos">Ver todo</Link>
          </Button>
        </div>

        {eventsQuery.isLoading ? (
          <EventsSkeleton />
        ) : eventsQuery.isError ? (
          <InlineError
            message="No se pudo cargar tu agenda."
            onRetry={() => eventsQuery.refetch()}
          />
        ) : upcoming.length === 0 ? (
          <EmptyEvents />
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
            <ul className="divide-y">
              {upcoming.map((evt) => (
                <li key={evt.id}>
                  <EventRow event={evt} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {/* Botón flotante: solo en móvil */}
      <MobileFab
        href="/tools/notas-venta/crear-nota-venta"
        aria-label="Nueva nota de venta"
        title="Nueva nota"
      />
    </div>
  )
}

/* ─── Subcomponentes ────────────────────────────────────────────────────── */

function SummaryCard({ balance, inputs, outputs }: { balance: number; inputs: number; outputs: number }) {
  return (
    <Card className="gap-0 py-0">
      <div className="p-5">
        <p className="text-sm text-muted-foreground">Te queda</p>
        <p
          className={cn(
            'mt-1 text-4xl font-semibold tracking-tight tabular-nums',
            balance < 0 && 'text-destructive'
          )}
        >
          {formatCurrency(balance)}
        </p>
      </div>
      <dl className="grid grid-cols-2 border-t">
        <Stat label="Entró" value={inputs} dotClass="bg-success" />
        <Stat label="Salió" value={outputs} dotClass="bg-destructive" className="border-l" />
      </dl>
    </Card>
  )
}

function Stat({
  label,
  value,
  dotClass,
  className,
}: {
  label: string
  value: number
  dotClass: string
  className?: string
}) {
  return (
    <div className={cn('px-5 py-4', className)}>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={cn('size-2 rounded-full', dotClass)} aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{formatCurrency(value)}</dd>
    </div>
  )
}

function EventRow({ event }: { event: AgendaEvent }) {
  const date = parseEventDate(event.date)
  const isPending = event.status === 'pending'

  return (
    <Link
      href="/tools/eventos"
      className={cn(
        'flex min-h-16 items-center gap-3 px-4 py-3',
        'transition-colors hover:bg-accent/60 active:bg-accent',
        'outline-none focus-visible:bg-accent'
      )}
    >
      {/* Fecha grande y legible */}
      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted leading-none">
        {date ? (
          <>
            <span className="text-lg font-semibold tabular-nums">{dayFmt.format(date)}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              {monthFmt.format(date).replace('.', '')}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{event.title}</p>
        {(event.clientName || event.place) && (
          <p className="truncate text-sm text-muted-foreground">{event.clientName || event.place}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {event.total !== undefined && (
          <span className="font-medium tabular-nums">{formatCurrency(event.total)}</span>
        )}
        <span className={cn('text-xs capitalize', isPending ? 'text-primary' : 'text-muted-foreground')}>
          {STATUS_LABEL[event.status]}
        </span>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
    </Link>
  )
}

function EmptyEvents() {
  return (
    <Card className="items-center gap-3 px-6 py-10 text-center">
      <CalendarX2 className="size-8 text-muted-foreground/60" aria-hidden />
      <p className="font-medium">No tienes nada pendiente</p>
      <Button asChild size="lg" className="mt-1">
        <Link href="/tools/eventos/crear-evento">Agendar</Link>
      </Button>
    </Card>
  )
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="flex-row items-center justify-between gap-3 px-5 py-4">
      <p className="text-sm text-muted-foreground">{message} Revisa tu conexión.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw aria-hidden />
        Reintentar
      </Button>
    </Card>
  )
}

function SummarySkeleton() {
  return (
    <Card className="gap-0 py-0" aria-busy="true" aria-label="Cargando resumen">
      <div className="space-y-2 p-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-2 border-t">
        <div className="space-y-2 px-5 py-4">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2 border-l px-5 py-4">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </Card>
  )
}

function EventsSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-busy="true" aria-label="Cargando tu agenda">
      <div className="divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  )
}