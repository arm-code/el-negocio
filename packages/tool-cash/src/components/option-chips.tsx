'use client'

// Elegir una opción tocando un botón, con la posibilidad de agregar una nueva ahí mismo.

import { useState } from 'react'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { LABEL } from '@el-negocio/ui/detail'
import { cn } from '@el-negocio/ui/utils'
import { useCreateCatalogItem } from '../hooks/use-cash'
import { LIMITS } from '../lib/limits'
import type { CatalogItem, CatalogKind } from '../types'

/** Opciones a la vista antes de "Ver otras". */
const VISIBLE = 3

interface OptionChipsProps {
  kind: CatalogKind
  label: string
  /** Nombre del campo para agregar, p. ej. "Nueva categoría". */
  newLabel: string
  items: CatalogItem[]
  isLoading: boolean
  value: string
  onChange: (id: string) => void
  error?: string
}

export function OptionChips({ kind, label, newLabel, items, isLoading, value, onChange, error }: OptionChipsProps) {
  const [showAll, setShowAll] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateCatalogItem(kind)

  const first = items.slice(0, VISIBLE)
  const selected = items.find((i) => i.id === value)
  // La elegida siempre se ve, aunque no esté entre las primeras
  const visible = showAll ? items : selected && !first.includes(selected) ? [...first.slice(0, -1), selected] : first

  function add() {
    const clean = name.trim()
    if (!clean || create.isPending) return
    create.mutate(clean, {
      onSuccess: (item) => {
        onChange(item.id)
        setAdding(false)
        setName('')
      },
      onError: () => toast.error('No se pudo agregar'),
    })
  }

  return (
    <div role="group" aria-label={label} className="space-y-2">
      <h3 className={LABEL}>{label}</h3>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {visible.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="outline"
              aria-pressed={item.id === value}
              onClick={() => onChange(item.id)}
              className={cn(
                'h-11 max-w-full rounded-xl px-4 text-[15px]',
                item.id === value && 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
            >
              <span className="truncate">{item.name}</span>
            </Button>
          ))}
          {!showAll && items.length > VISIBLE && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl px-3 text-muted-foreground"
              onClick={() => setShowAll(true)}
            >
              Ver otras
              <ChevronDown aria-hidden="true" />
            </Button>
          )}
          {!adding && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl px-3 text-muted-foreground"
              aria-label={newLabel}
              onClick={() => setAdding(true)}
            >
              <Plus aria-hidden="true" />
              Nueva
            </Button>
          )}
        </div>
      )}

      {adding && (
        <div className="flex gap-2">
          <Input
            aria-label={newLabel}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter agrega la opción, no guarda el movimiento
              if (e.key !== 'Enter') return
              e.preventDefault()
              add()
            }}
            placeholder={newLabel}
            maxLength={LIMITS.optionName}
            autoCapitalize="sentences"
            autoFocus
            className="h-11 text-base"
          />
          <Button type="button" className="h-11 rounded-xl" onClick={add} disabled={!name.trim() || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : 'Agregar'}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
