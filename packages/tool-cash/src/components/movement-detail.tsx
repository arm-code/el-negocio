'use client'

// Detalle de un movimiento, con corregir y borrar.

import { Pencil, Trash2 } from 'lucide-react'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { DetailAmountRow, DetailDateRow, DetailSummary, TOUCH } from '@el-negocio/ui/detail'
import { cn } from '@el-negocio/ui/utils'
import type { Movement } from '../types'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-base font-medium">{value}</dd>
    </div>
  )
}

interface MovementDetailProps {
  movement: Movement | null
  onClose: () => void
  onEdit: (movement: Movement) => void
  onDelete: (movement: Movement) => void
}

export function MovementDetail({ movement, onClose, onEdit, onDelete }: MovementDetailProps) {
  return (
    <AppBottomSheet
      open={movement !== null}
      onOpenChange={(open) => !open && onClose()}
      title={movement?.kind === 'in' ? 'Entrada' : 'Salida'}
      footer={
        movement && (
          <Button className={cn(TOUCH, 'w-full text-base')} onClick={() => onEdit(movement)}>
            <Pencil aria-hidden="true" />
            Corregir
          </Button>
        )
      }
    >
      {movement && (
        <div className="space-y-6">
          <DetailSummary>
            <DetailAmountRow label={movement.kind === 'in' ? 'Entró' : 'Salió'} amount={movement.amount} />
            <DetailDateRow value={movement.date} dateOnly />
          </DetailSummary>
          <DetailSummary>
            <Row label="De qué fue" value={movement.category.name} />
            <Row label="Cómo se pagó" value={movement.method.name} />
            {movement.description && <Row label="Detalle" value={movement.description} />}
          </DetailSummary>
          <Button
            variant="ghost"
            className={cn(TOUCH, 'w-full text-destructive hover:bg-destructive/10 hover:text-destructive')}
            onClick={() => onDelete(movement)}
          >
            <Trash2 aria-hidden="true" />
            Borrar
          </Button>
        </div>
      )}
    </AppBottomSheet>
  )
}
