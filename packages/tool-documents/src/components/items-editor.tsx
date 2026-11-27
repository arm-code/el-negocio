'use client'

// La lista de artículos de una renta, un renglón por artículo.

import { Plus, X } from 'lucide-react'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { LABEL, TOUCH } from '@el-negocio/ui/detail'
import { parseAmount } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { itemsTotal, moneyText } from '../lib/format'
import { LIMITS } from '../lib/limits'
import type { ItemsInfo } from '../lib/templates'
import type { DocumentItem } from '../types'

/** Un renglón mientras se captura: las cantidades como se teclean. */
export interface ItemDraft {
  key: number
  quantity: string
  description: string
  unitValue: string
}

let nextKey = 0

export const emptyRow = (): ItemDraft => ({ key: ++nextKey, quantity: '1', description: '', unitValue: '' })

export const toRows = (items: DocumentItem[]): ItemDraft[] =>
  items.length
    ? items.map((item) => ({
        key: ++nextKey,
        quantity: String(item.quantity),
        description: item.description,
        unitValue: item.unitValue ? String(item.unitValue) : '',
      }))
    : [emptyRow()]

const isBlank = (row: ItemDraft) => !row.description.trim() && !row.unitValue.trim()

/** Los renglones llenos como artículos, y qué le falta al primero que no sirva. */
export function readRows(rows: ItemDraft[], info: ItemsInfo): { items: DocumentItem[]; error: string } {
  const items: DocumentItem[] = []
  let error = ''
  for (const [index, row] of rows.entries()) {
    if (isBlank(row)) continue
    const quantity = parseAmount(row.quantity)
    const unitValue = row.unitValue.trim() ? Math.round(parseAmount(row.unitValue) * 100) / 100 : 0
    const problem = !row.description.trim()
      ? 'escribe qué es'
      : !(quantity > 0 && quantity <= LIMITS.maxQuantity)
        ? 'revisa la cantidad'
        : !(unitValue >= 0 && unitValue <= LIMITS.maxAmount) || (info.totalIsAmount && !unitValue)
          ? 'escribe cuánto vale cada uno'
          : ''
    if (problem) error ||= `Artículo ${index + 1}: ${problem}`
    else items.push({ quantity, description: row.description.trim(), unitValue })
  }
  if (!error && info.required && items.length === 0) error = 'Agrega al menos un artículo'
  if (!error && info.totalIsAmount && itemsTotal(items) > LIMITS.maxAmount) error = 'El total es demasiado alto'
  return { items, error }
}

interface ItemsEditorProps {
  info: ItemsInfo
  rows: ItemDraft[]
  onChange: (rows: ItemDraft[]) => void
  error?: string
}

export function ItemsEditor({ info, rows, onChange, error }: ItemsEditorProps) {
  const set = (key: number, changes: Partial<ItemDraft>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)))
  const total = itemsTotal(readRows(rows, { ...info, required: false, totalIsAmount: false }).items)

  return (
    <div role="group" aria-label={info.title} className="space-y-3">
      <h3 className={LABEL}>{info.title}</h3>

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.key} className="space-y-2 rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <Input
                aria-label={`Artículo ${index + 1}`}
                value={row.description}
                onChange={(e) => set(row.key, { description: e.target.value })}
                placeholder="Ej. Silla plegable"
                maxLength={LIMITS.itemDescription}
                autoCapitalize="sentences"
                className="h-11 text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-full text-muted-foreground"
                aria-label={`Quitar artículo ${index + 1}`}
                onClick={() => onChange(rows.length > 1 ? rows.filter((r) => r.key !== row.key) : [emptyRow()])}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2">
              <label className="space-y-1">
                <span className="block text-xs text-muted-foreground">Cantidad</span>
                <Input
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(e) => set(row.key, { quantity: e.target.value })}
                  className="h-11 text-base tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="block truncate text-xs text-muted-foreground">
                  {info.valueLabel} c/u ($){info.totalIsAmount ? '' : ', opcional'}
                </span>
                <Input
                  inputMode="decimal"
                  value={row.unitValue}
                  onChange={(e) => set(row.key, { unitValue: e.target.value })}
                  placeholder="0.00"
                  className="h-11 text-base tabular-nums"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {rows.length < LIMITS.items && (
        <Button type="button" variant="outline" className={cn(TOUCH, 'w-full')} onClick={() => onChange([...rows, emptyRow()])}>
          <Plus aria-hidden="true" />
          Otro artículo
        </Button>
      )}

      {info.totalIsAmount && (
        <p className="flex justify-between gap-3 text-base font-semibold">
          <span>Total (monto del pagaré)</span>
          <span className="tabular-nums">{moneyText(total)}</span>
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
