import { Card } from '@el-negocio/ui/card'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { formatCurrency } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import type { Totals } from '../types'

/** Lo que queda en grande; abajo, lo que entró y lo que salió. */
export function SummaryCard({ label, totals }: { label: string; totals: Totals }) {
  // En centavos: restar decimales directamente deja colas como 0.30000000000000004
  const balance = (Math.round(totals.in * 100) - Math.round(totals.out * 100)) / 100

  return (
    <Card className="gap-0 py-0">
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
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
        <div className="min-w-0 px-5 py-4">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            Entró
          </dt>
          <dd className="mt-1 truncate text-lg font-medium tabular-nums">{formatCurrency(totals.in)}</dd>
        </div>
        <div className="min-w-0 border-l px-5 py-4">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
            Salió
          </dt>
          <dd className="mt-1 truncate text-lg font-medium tabular-nums">{formatCurrency(totals.out)}</dd>
        </div>
      </dl>
    </Card>
  )
}

export function SummarySkeleton() {
  return <Skeleton className="h-44 w-full rounded-xl" aria-busy="true" aria-label="Cargando resumen" />
}
