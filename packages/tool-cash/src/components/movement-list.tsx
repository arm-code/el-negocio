'use client'

import { ChevronRight } from 'lucide-react'
import { Card } from '@el-negocio/ui/card'
import { LABEL } from '@el-negocio/ui/detail'
import { describeDate, formatCurrency } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import type { Movement } from '../types'

/** Agrupa por día conservando el orden que entrega el almacenamiento. */
function groupByDay(movements: Movement[]) {
  const groups: { date: string; label: string; items: Movement[] }[] = []
  for (const movement of movements) {
    let group = groups.at(-1)
    if (group?.date !== movement.date) {
      const info = describeDate(movement.date, { dateOnly: true })
      const label = info ? (Math.abs(info.days) <= 1 ? info.relative : info.label) : 'Sin fecha'
      group = { date: movement.date, label, items: [] }
      groups.push(group)
    }
    group.items.push(movement)
  }
  return groups
}

export function MovementList({ movements, onSelect }: { movements: Movement[]; onSelect: (m: Movement) => void }) {
  return (
    <div className="space-y-5">
      {groupByDay(movements).map((group) => (
        <div key={group.date} className="space-y-2">
          <h3 className={LABEL}>{group.label}</h3>
          <Card className="gap-0 overflow-hidden py-0">
            <ul className="divide-y">
              {group.items.map((movement) => (
                <li key={movement.id}>
                  <MovementRow movement={movement} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  )
}

function MovementRow({ movement, onSelect }: { movement: Movement; onSelect: (m: Movement) => void }) {
  const isIn = movement.kind === 'in'
  const title = movement.description || movement.category.name
  const detail = [movement.description ? movement.category.name : '', movement.method.name]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      onClick={() => onSelect(movement)}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent active:bg-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium first-letter:uppercase">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{detail}</span>
      </span>
      <span className={cn('shrink-0 text-base font-semibold tabular-nums', isIn && 'text-success')}>
        <span className="sr-only">{isIn ? 'Entró' : 'Salió'} </span>
        <span aria-hidden="true">{isIn ? '+' : '−'}</span>
        {formatCurrency(movement.amount)}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
    </button>
  )
}
