'use client'

// Pantalla principal: pendientes, hechos y cancelados, agrupados por día.

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, ChevronRight, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@el-negocio/ui/button'
import { Card } from '@el-negocio/ui/card'
import { PageHeader } from '@el-negocio/ui/page-header'
import { SearchInput } from '@el-negocio/ui/search-input'
import { MobileFab } from '@el-negocio/ui/mobile-fab'
import { ConfirmDialog } from '@el-negocio/ui/confirm-dialog'
import { EmptyState, InlineError, ListSkeleton } from '@el-negocio/ui/states'
import { LABEL, TOUCH } from '@el-negocio/ui/detail'
import { formatCurrency, normalizeSearch } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useDeleteEvent, useEvents, useSetStatus } from '../hooks/use-agenda'
import { useAgendaConfig } from '../provider'
import { agendaMeta } from '../meta'
import { amountDue } from '../lib/money'
import { dayName, groupEvents, tabOf, timeName, type Tab } from '../lib/when'
import type { AgendaEvent, EventStatus } from '../types'
import { EventDetail } from './event-detail'
import { EventForm, type FormTarget } from './event-form'

const TABS: readonly { value: Tab; label: string; empty: string }[] = [
  { value: 'pending', label: 'Pendientes', empty: 'No tienes nada pendiente' },
  { value: 'done', label: 'Hechos', empty: 'Aún no has marcado nada como hecho' },
  { value: 'cancelled', label: 'Cancelados', empty: 'No hay nada cancelado' },
]

const STATUS_NAME: Record<EventStatus, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
  done: 'Hecho',
  cancelled: 'Cancelado',
}

const STATUS_TOAST: Record<EventStatus, string> = {
  pending: 'Vuelve a estar pendiente',
  delivered: 'Marcado como entregado',
  done: 'Marcado como hecho',
  cancelled: 'Cancelado',
}

/** Con pocos registros, buscar es ruido. */
const SEARCH_MIN = 6

interface AgendaHomeProps {
  headerAction?: ReactNode
  /** Abre de una vez la captura, p. ej. al llegar desde un acceso "Agendar". */
  startNew?: boolean
  /** Secciones propias de la aplicación en el detalle de lo agendado. */
  renderExtra?: (event: AgendaEvent) => ReactNode
}

export function AgendaHome({ headerAction, startNew, renderExtra }: AgendaHomeProps) {
  const { routes, copy } = useAgendaConfig()
  const [tab, setTab] = useState<Tab>('pending')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormTarget | null>(startNew ? { new: true } : null)
  const [toDelete, setToDelete] = useState<AgendaEvent | null>(null)

  const { data: events, isError, refetch } = useEvents()
  const setStatus = useSetStatus()
  const remove = useDeleteEvent()

  // Siempre la versión recién leída, p. ej. después de anotar un pago
  const selected = events?.find((e) => e.id === selectedId) ?? null

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { pending: 0, done: 0, cancelled: 0 }
    for (const event of events ?? []) result[tabOf(event)]++
    return result
  }, [events])

  const search = normalizeSearch(query.trim())
  const groups = useMemo(() => {
    const all = events ?? []
    if (!search) return groupEvents(all.filter((e) => tabOf(e) === tab), tab)
    // Al buscar se revisa todo, no solo la pestaña
    const found = all.filter((e) =>
      normalizeSearch([e.title, e.clientName, e.clientPhone, e.place, e.folio].filter(Boolean).join(' ')).includes(
        search
      )
    )
    return groupEvents(found, 'done')
  }, [events, tab, search])

  const hasEvents = (events?.length ?? 0) > 0

  function changeStatus(event: AgendaEvent, status: EventStatus) {
    setStatus.mutate(
      { id: event.id, status },
      {
        onSuccess: () => {
          toast.success(STATUS_TOAST[status])
          setSelectedId(null)
        },
        onError: () => toast.error(copy.saveError),
      }
    )
  }

  function confirmDelete() {
    if (!toDelete) return
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Borrado')
        setToDelete(null)
      },
      onError: () => toast.error(copy.deleteError),
    })
  }

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2 h-11 text-muted-foreground hover:text-foreground">
          <Link href={routes.home}>
            <ArrowLeft aria-hidden="true" />
            {copy.backLabel}
          </Link>
        </Button>
        <PageHeader
          title={agendaMeta.title}
          description={copy.description}
          action={
            <>
              {headerAction}
              {/* En celular la acción es el botón flotante o el del estado vacío */}
              {hasEvents && (
                <Button className={cn(TOUCH, 'hidden sm:inline-flex')} onClick={() => setForm({ new: true })}>
                  <CalendarPlus aria-hidden="true" />
                  Agendar
                </Button>
              )}
            </>
          }
        />
      </div>

      {isError ? (
        <InlineError message="No se pudo cargar tu agenda." onRetry={() => refetch()} />
      ) : !events ? (
        <ListSkeleton label="Cargando tu agenda" />
      ) : !hasEvents ? (
        <EmptyState
          title="Anota lo primero"
          description="Citas, pedidos, entregas: solo necesitas escribir qué es y cuándo."
          action={
            <Button className="mt-2 h-14 rounded-2xl px-8 text-lg" onClick={() => setForm({ new: true })}>
              <CalendarPlus aria-hidden="true" />
              Agendar
            </Button>
          }
        />
      ) : (
        <>
          {/* Con una búsqueda escrita no se esconde: dejaría la lista filtrada sin salida */}
          {(events.length >= SEARCH_MIN || query) && (
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar en tu agenda" />
          )}

          {!search && (
            <div role="group" aria-label="Qué ver" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {TABS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={tab === option.value}
                  onClick={() => setTab(option.value)}
                  className={cn(
                    'min-h-11 rounded-lg px-1 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    tab === option.value ? 'bg-card shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  {option.label}
                  <span className="ml-1 text-muted-foreground tabular-nums">{counts[option.value]}</span>
                </button>
              ))}
            </div>
          )}

          <section aria-label="Lo agendado" className="space-y-5">
            {groups.length === 0 ? (
              <EmptyState
                title={search ? 'Nada coincide con tu búsqueda' : TABS.find((t) => t.value === tab)!.empty}
              />
            ) : (
              groups.map((group) => (
                <div key={group.key} className="space-y-2">
                  <h2 className={cn(LABEL, group.late && 'text-destructive')}>{group.label}</h2>
                  <Card className="gap-0 overflow-hidden py-0">
                    <ul className="divide-y">
                      {group.items.map((event) => (
                        <li key={event.id}>
                          <EventRow
                            event={event}
                            showDate={group.late}
                            // Cuando el encabezado o la pestaña no lo dicen ya
                            showStatus={Boolean(search) || (event.status === 'delivered' && !group.late)}
                            onSelect={(e) => setSelectedId(e.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ))
            )}
          </section>

          <MobileFab aria-label="Agendar" title="Agendar" onClick={() => setForm({ new: true })} />
        </>
      )}

      <EventDetail
        event={selected}
        isChanging={setStatus.isPending}
        onClose={() => setSelectedId(null)}
        onEdit={(event) => {
          setSelectedId(null)
          setForm({ editId: event.id })
        }}
        onStatus={changeStatus}
        onDelete={(event) => {
          setSelectedId(null)
          setToDelete(event)
        }}
        renderExtra={renderExtra}
      />

      <EventForm
        target={form}
        onClose={() => setForm(null)}
        onSaved={(event) => {
          setForm(null)
          // Lleva a donde quedó, para que se vea que sí se guardó
          setTab(tabOf(event))
          setQuery('')
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`¿Borrar "${toDelete?.title ?? ''}"?`}
        description={copy.deleteWarning}
        confirmText="Sí, borrar"
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </div>
  )
}

function EventRow({
  event,
  showDate,
  showStatus,
  onSelect,
}: {
  event: AgendaEvent
  /** Cuando el encabezado del grupo no dice el día. */
  showDate?: boolean
  showStatus?: boolean
  onSelect: (event: AgendaEvent) => void
}) {
  const who = event.clientName
  const detail = [
    showDate ? dayName(event.date) : '',
    event.time ? timeName(event.time) : '',
    showStatus ? STATUS_NAME[event.status] : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const due = amountDue(event)
  const charge = event.total !== undefined && event.status !== 'cancelled'

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent active:bg-accent"
    >
      <span className="min-w-0 flex-1">
        {detail && <span className="block text-sm font-semibold text-primary">{detail}</span>}
        <span className="block truncate text-base font-medium first-letter:uppercase">{event.title}</span>
        {(who || event.place) && (
          <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            {who ? (
              <User className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{who || event.place}</span>
          </span>
        )}
      </span>
      {charge && (
        <span
          className={cn(
            'shrink-0 text-right text-sm font-semibold tabular-nums',
            due > 0 ? 'text-destructive' : 'text-success'
          )}
        >
          {due > 0 ? (
            <>
              <span className="block text-xs font-normal">Falta</span>
              {formatCurrency(due)}
            </>
          ) : (
            'Pagado'
          )}
        </span>
      )}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
    </button>
  )
}
