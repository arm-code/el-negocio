'use client'

// Pantalla principal: periodo, resumen, anotar y la lista de movimientos.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@el-negocio/ui/button'
import { PageHeader } from '@el-negocio/ui/page-header'
import { ConfirmDialog } from '@el-negocio/ui/confirm-dialog'
import { LoadMore } from '@el-negocio/ui/load-more'
import { EmptyState, InlineError, ListSkeleton } from '@el-negocio/ui/states'
import { TOUCH } from '@el-negocio/ui/detail'
import { formatCurrency } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useDeleteMovement, useMovements, useSummary } from '../hooks/use-cash'
import { useCashConfig } from '../provider'
import { cashMeta } from '../meta'
import {
  compareMonths,
  currentMonth,
  monthInSentence,
  monthLabel,
  monthOf,
  monthPeriod,
  shiftMonth,
  type Month,
} from '../lib/period'
import type { Movement } from '../types'
import { SummaryCard, SummarySkeleton } from './summary-card'
import { MovementList } from './movement-list'
import { MovementDetail } from './movement-detail'
import { MovementForm, type FormTarget } from './movement-form'

interface CashHomeProps {
  /** Hueco para lo que solo tiene una app, p. ej. sus ajustes. Va junto al título. */
  headerAction?: React.ReactNode
}

export function CashHome({ headerAction }: CashHomeProps) {
  const { routes, copy } = useCashConfig()
  const [month, setMonth] = useState<Month>(currentMonth)
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<Movement | null>(null)
  const [form, setForm] = useState<FormTarget | null>(null)
  const [toDelete, setToDelete] = useState<Movement | null>(null)

  const period = useMemo(() => (showAll ? null : monthPeriod(month)), [showAll, month])
  const summary = useSummary(period)
  const list = useMovements(period)
  const remove = useDeleteMovement()

  // Sin repetidos: si se anota algo mientras se piden más páginas, los resultados se recorren
  const movements = useMemo(() => {
    const byId = new Map<string, Movement>()
    for (const page of list.data?.pages ?? []) for (const item of page.items) byId.set(item.id, item)
    return [...byId.values()]
  }, [list.data])

  const today = currentMonth()
  const isCurrent = compareMonths(month, today) === 0
  const summaryLabel = showAll
    ? 'Te queda en total'
    : isCurrent
      ? 'Te queda este mes'
      : `Quedó en ${monthInSentence(month)}`

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
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2 h-11 text-muted-foreground hover:text-foreground">
          <Link href={routes.home}>
            <ArrowLeft aria-hidden="true" />
            {copy.backLabel}
          </Link>
        </Button>
        <PageHeader
          title={cashMeta.title}
          description={copy.description}
          action={headerAction}
          // En celular la acción queda arriba a la derecha, no debajo del título
          className={headerAction ? 'flex-row items-start justify-between' : undefined}
        />
      </div>

      <section aria-label="Resumen" className="space-y-3">
        <div className="flex items-center gap-2">
          {showAll ? (
            <p className="flex-1 text-base font-semibold">Todo el historial</p>
          ) : (
            <div className="flex flex-1 items-center justify-between rounded-xl border bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl"
                aria-label="Mes anterior"
                onClick={() => setMonth((m) => shiftMonth(m, -1))}
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
              <p aria-live="polite" className="truncate text-base font-semibold">
                {monthLabel(month)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl"
                aria-label="Mes siguiente"
                disabled={compareMonths(month, today) >= 0}
                onClick={() => setMonth((m) => shiftMonth(m, 1))}
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          )}
          <Button variant="outline" className="h-11 shrink-0 rounded-xl" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Ver por mes' : 'Ver todo'}
          </Button>
        </div>

        {summary.isError ? (
          <InlineError message="No se pudo cargar el resumen." onRetry={() => summary.refetch()} />
        ) : summary.data ? (
          <SummaryCard label={summaryLabel} totals={summary.data} />
        ) : (
          <SummarySkeleton />
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className={cn(TOUCH, 'h-14 text-base font-semibold')} onClick={() => setForm({ kind: 'in' })}>
            <Plus className="size-5 text-success" aria-hidden="true" />
            Entrada
          </Button>
          <Button variant="outline" className={cn(TOUCH, 'h-14 text-base font-semibold')} onClick={() => setForm({ kind: 'out' })}>
            <Minus className="size-5 text-destructive" aria-hidden="true" />
            Salida
          </Button>
        </div>
      </section>

      <section aria-label="Lo anotado">
        {list.isError && movements.length === 0 ? (
          <InlineError message="No se pudo cargar lo anotado." onRetry={() => list.refetch()} />
        ) : !list.data ? (
          <ListSkeleton label="Cargando" />
        ) : movements.length === 0 ? (
          <EmptyState
            title={showAll ? 'Aún no has anotado nada' : `No hay nada anotado en ${monthInSentence(month)}`}
            description="Toca Entrada o Salida para anotar lo que entra y sale de tu negocio."
          />
        ) : (
          <>
            <MovementList movements={movements} onSelect={setSelected} />
            <LoadMore
              hasNextPage={list.hasNextPage}
              isFetching={list.isFetchingNextPage}
              isError={list.isFetchNextPageError}
              showEnd={false}
              onLoadMore={() => list.fetchNextPage()}
              label="Ver más"
            />
          </>
        )}
      </section>

      <MovementDetail
        movement={selected}
        onClose={() => setSelected(null)}
        onEdit={(movement) => {
          setSelected(null)
          setForm({ editId: movement.id })
        }}
        onDelete={(movement) => {
          setSelected(null)
          setToDelete(movement)
        }}
      />

      <MovementForm
        target={form}
        onClose={() => setForm(null)}
        onSaved={(movement) => {
          setForm(null)
          // Lleva a donde quedó, para que se vea que sí se guardó
          setMonth(monthOf(movement.date))
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`¿Borrar la ${toDelete?.kind === 'in' ? 'entrada' : 'salida'} de ${formatCurrency(toDelete?.amount ?? 0)}?`}
        description={copy.deleteWarning}
        confirmText="Sí, borrar"
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </div>
  )
}
