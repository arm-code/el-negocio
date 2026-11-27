'use client'

// Fecha y detalle casi nunca se tocan (se anota lo de hoy y sin explicación), así
// que van plegados: dos botones discretos que abren su campo solo si se necesita.

import { useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { LABEL } from '@el-negocio/ui/detail'
import { describeDate, toLocalDateInput } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { LIMITS } from '../lib/limits'

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toLocalDateInput(date)
}

interface DateAndDetailProps {
  date: string
  onDateChange: (date: string) => void
  /** Si hay error, la fecha se muestra abierta. */
  dateError?: string
  description: string
  onDescriptionChange: (description: string) => void
}

export function DateAndDetail({ date, onDateChange, dateError, description, onDescriptionChange }: DateAndDetailProps) {
  const [dateOpen, setDateOpen] = useState(false)
  // Al corregir algo que ya tiene detalle, se muestra de una vez
  const [startedWithDetail] = useState(Boolean(description))
  const [detailOpen, setDetailOpen] = useState(startedWithDetail)

  const today = daysAgo(0)
  const yesterday = daysAgo(1)
  const dateName =
    date === today ? 'Hoy' : date === yesterday ? 'Ayer' : (describeDate(date, { dateOnly: true })?.label ?? 'Sin fecha')
  const showDate = dateOpen || Boolean(dateError)

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={showDate}
          onClick={() => setDateOpen((open) => !open)}
          className="-ml-3 h-11 rounded-xl px-3 text-muted-foreground"
        >
          <CalendarDays aria-hidden="true" />
          <span>
            Fecha: <strong className={cn('font-semibold', date !== today && 'text-foreground')}>{dateName}</strong>
          </span>
        </Button>
        {!detailOpen && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDetailOpen(true)}
            className="-mr-3 h-11 rounded-xl px-3 text-muted-foreground"
          >
            <Plus aria-hidden="true" />
            Agregar detalle
          </Button>
        )}
      </div>

      {showDate && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {[
              { label: 'Hoy', value: today },
              { label: 'Ayer', value: yesterday },
            ].map((option) => (
              <Button
                key={option.label}
                type="button"
                variant="outline"
                aria-pressed={date === option.value}
                onClick={() => {
                  onDateChange(option.value)
                  setDateOpen(false)
                }}
                className={cn(
                  'h-11 rounded-xl px-4',
                  date === option.value && 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                )}
              >
                {option.label}
              </Button>
            ))}
            <Input
              type="date"
              aria-label="Otra fecha"
              value={date}
              // No se anota lo que todavía no pasa
              max={today}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-11 min-w-0 flex-1 text-base"
            />
          </div>
          {dateError && <p className="text-sm text-destructive">{dateError}</p>}
        </div>
      )}

      {detailOpen && (
        <div className="space-y-2">
          <label htmlFor="cash-description" className={LABEL}>
            Detalle (opcional)
          </label>
          <Input
            id="cash-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ej. Refrescos del proveedor"
            maxLength={LIMITS.description}
            autoCapitalize="sentences"
            autoComplete="off"
            autoFocus={!startedWithDetail}
            className="h-12 text-base"
          />
        </div>
      )}
    </div>
  )
}
