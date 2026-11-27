'use client'

// El cobro de algo agendado: cuánto es, cuánto va y cuánto falta. Cada pago se anota
// como entrada en la Caja.

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Banknote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@el-negocio/ui/button'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { DetailSection, TOUCH } from '@el-negocio/ui/detail'
import { formatCurrency } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { usePaymentMethods, usePayments, useRecordPayment } from '../hooks/use-agenda'
import { useAgendaConfig } from '../provider'
import { LIMITS } from '../lib/limits'
import { amountDue, sumPayments } from '../lib/money'
import { readMethod, rememberMethod } from '../lib/prefs'
import { dayFromToday, dayName } from '../lib/when'
import type { AgendaEvent } from '../types'
import { AmountInput, MethodChips, toAmount } from './money-fields'

export function ChargeSection({ event }: { event: AgendaEvent }) {
  const { routes } = useAgendaConfig()
  const payments = usePayments(event.id)
  const [capturing, setCapturing] = useState(false)

  // La lista recién leída manda: el registro abierto puede ser de antes del último pago
  const paid = payments.data ? sumPayments(payments.data) : event.paid
  const due = amountDue({ total: event.total, paid })
  const cancelled = event.status === 'cancelled'
  const canAdd = !cancelled && (due > 0 || event.total === undefined)

  return (
    <DetailSection title="Cobro">
      <dl className="space-y-1 text-base">
        {event.total !== undefined && <Row label="Total" value={formatCurrency(event.total)} />}
        <Row label="Cobrado" value={formatCurrency(paid)} />
        {event.total !== undefined && !cancelled && (
          <Row
            label={due > 0 ? 'Falta' : 'Pagado'}
            value={due > 0 ? formatCurrency(due) : '✓'}
            className={cn('font-semibold', due > 0 ? 'text-destructive' : 'text-success')}
          />
        )}
      </dl>

      {payments.isError ? (
        <InlineError message="No se pudieron cargar los pagos." onRetry={() => payments.refetch()} />
      ) : !payments.data ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : (
        payments.data.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {payments.data.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  {dayName(payment.date)} · {payment.method}
                </span>
                <span className="font-medium tabular-nums text-success">{formatCurrency(payment.amount)}</span>
              </li>
            ))}
          </ul>
        )
      )}

      {payments.data &&
        (capturing ? (
          <PaymentForm event={event} due={due} onDone={() => setCapturing(false)} />
        ) : (
          canAdd && (
            <Button variant="outline" className={cn(TOUCH, 'w-full')} onClick={() => setCapturing(true)}>
              <Banknote aria-hidden="true" />
              Anotar un pago
            </Button>
          )
        ))}

      {routes.cash && payments.data && payments.data.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Para corregir un pago, búscalo en{' '}
          <Link href={routes.cash} className="font-medium text-primary underline underline-offset-4">
            Entradas y salidas
          </Link>
          .
        </p>
      )}
    </DetailSection>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

function PaymentForm({ event, due, onDone }: { event: AgendaEvent; due: number; onDone: () => void }) {
  const { copy } = useAgendaConfig()
  const methods = usePaymentMethods()
  const record = useRecordPayment()
  // Lo normal es que liquide: se propone lo que falta
  const [text, setText] = useState(due > 0 ? String(due) : '')
  const [chosen, setChosen] = useState(readMethod)
  const [submitted, setSubmitted] = useState(false)

  const amount = toAmount(text)
  const methodId = (methods.data?.find((m) => m.id === chosen) ?? methods.data?.[0])?.id ?? ''
  const errors = {
    amount: !(amount > 0)
      ? 'Escribe cuánto te dio'
      : amount > LIMITS.maxAmount
        ? 'Revisa la cantidad, parece demasiado alta'
        : event.total !== undefined && amount > due
          ? `Solo falta ${formatCurrency(due)}`
          : '',
    method: methodId ? '' : 'Elige cómo te pagó',
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const problem = errors.amount || errors.method
    if (problem) {
      toast.error(problem)
      return
    }
    record.mutate(
      { event, payment: { amount, methodId, date: dayFromToday(0) } },
      {
        onSuccess: () => {
          rememberMethod(methodId)
          toast.success('Pago anotado en Caja')
          onDone()
        },
        onError: () => toast.error(copy.saveError),
      }
    )
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border p-4">
      <AmountInput
        id="agenda-payment"
        label="¿Cuánto te dio? ($)"
        value={text}
        onChange={setText}
        autoFocus
        error={submitted ? errors.amount : ''}
      />
      <MethodChips
        label="¿Cómo te pagó?"
        methods={methods}
        value={methodId}
        onChange={setChosen}
        error={submitted ? errors.method : ''}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className={TOUCH} onClick={onDone} disabled={record.isPending}>
          Volver
        </Button>
        <Button type="submit" className={TOUCH} disabled={record.isPending}>
          {record.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Anotar pago
        </Button>
      </div>
    </form>
  )
}
