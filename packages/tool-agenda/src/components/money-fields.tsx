'use client'

// Capturar una cantidad y elegir cómo se pagó.

import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { LABEL } from '@el-negocio/ui/detail'
import { parseAmount } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import type { usePaymentMethods } from '../hooks/use-agenda'

/** Vacío es 0; lo que no es una cantidad, NaN. Redondeado a centavos. */
export function toAmount(text: string): number {
  if (!text.trim()) return 0
  return Math.round(parseAmount(text) * 100) / 100
}

interface AmountInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  error?: string
}

export function AmountInput({ id, label, value, onChange, placeholder = '0.00', autoFocus, error }: AmountInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        // Es dinero que entra: en verde, como en entradas y salidas
        className="h-12 text-lg tabular-nums focus-visible:border-success focus-visible:ring-success/40 md:text-lg"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface MethodChipsProps {
  label: string
  methods: ReturnType<typeof usePaymentMethods>
  value: string
  onChange: (id: string) => void
  error?: string
}

export function MethodChips({ label, methods, value, onChange, error }: MethodChipsProps) {
  return (
    <div role="group" aria-label={label} className="space-y-2">
      <h3 className={LABEL}>{label}</h3>
      {methods.isError ? (
        <InlineError message="No se pudieron cargar las formas de pago." onRetry={() => methods.refetch()} />
      ) : !methods.data ? (
        <Skeleton className="h-11 w-full rounded-xl" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {methods.data.map((method) => (
            <Button
              key={method.id}
              type="button"
              variant="outline"
              aria-pressed={method.id === value}
              onClick={() => onChange(method.id)}
              className={cn(
                'h-11 max-w-full rounded-xl px-4 text-[15px]',
                method.id === value && 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
              )}
            >
              <span className="truncate">{method.name}</span>
            </Button>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
