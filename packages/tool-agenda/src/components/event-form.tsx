'use client'

// Hoja para agendar algo o corregirlo. A la vista solo qué y cuándo; lo demás se
// agrega con un toque y queda abierto la próxima vez.

import { useState, type FormEvent, type ReactNode } from 'react'
import { Banknote, Clock, IdCard, Loader2, MapPin, NotebookPen, Plus, Undo2, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { LABEL, TOUCH } from '@el-negocio/ui/detail'
import { formatCurrency } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useEvent, useEvents, usePaymentMethods, useRecordPayment, useSaveEvent } from '../hooks/use-agenda'
import { useAgendaConfig } from '../provider'
import { LIMITS } from '../lib/limits'
import { dayFromToday } from '../lib/when'
import { BLOCKS, readBlocks, readMethod, rememberBlocks, rememberMethod, type Block } from '../lib/prefs'
import type { AgendaEvent } from '../types'
import { AmountInput, MethodChips, toAmount } from './money-fields'

/** Qué se está capturando: algo nuevo, o la corrección de algo. */
export type FormTarget = { new: true } | { editId: string }

const FORM_ID = 'agenda-event-form'

const BLOCK_INFO: Record<Block, { label: string; icon: typeof Clock }> = {
  time: { label: 'Hora', icon: Clock },
  client: { label: 'Cliente', icon: User },
  place: { label: 'Lugar', icon: MapPin },
  charge: { label: 'Cobro', icon: Banknote },
  return: { label: 'Devolución', icon: Undo2 },
  guarantee: { label: 'Garantía', icon: IdCard },
  notes: { label: 'Notas', icon: NotebookPen },
}

/** Cuántas garantías ya escritas se ofrecen para no volver a teclearlas. */
const SUGGESTIONS = 3

interface EventFormProps {
  target: FormTarget | null
  onClose: () => void
  onSaved: (event: AgendaEvent) => void
}

export function EventForm({ target, onClose, onSaved }: EventFormProps) {
  if (!target) return null
  if ('editId' in target) {
    return <EditEvent key={target.editId} id={target.editId} onClose={onClose} onSaved={onSaved} />
  }
  return <Fields onClose={onClose} onSaved={onSaved} />
}

/** Lee lo recién consultado antes de dejar corregirlo. */
function EditEvent({ id, onClose, onSaved }: { id: string } & Omit<EventFormProps, 'target'>) {
  const { data, isFetchedAfterMount, isError, refetch } = useEvent(id)
  const [initial, setInitial] = useState<AgendaEvent | null>(null)

  // Se queda con la primera lectura fresca: si una posterior falla, no se pierde
  // lo que se está capturando
  if (!initial && data && isFetchedAfterMount && !isError) setInitial(data)

  if (initial) return <Fields initial={initial} onClose={onClose} onSaved={onSaved} />

  return (
    <AppBottomSheet open onOpenChange={(open) => !open && onClose()} title="Corregir">
      {!isFetchedAfterMount ? (
        <Skeleton className="h-64 w-full rounded-xl" aria-busy="true" />
      ) : isError ? (
        <InlineError message="No se pudo cargar." onRetry={() => refetch()} />
      ) : (
        <p className="py-8 text-center text-muted-foreground">Ya no existe. Puede que se haya borrado.</p>
      )}
    </AppBottomSheet>
  )
}

function usedBlocks(event: AgendaEvent): Block[] {
  const filled: Record<Block, boolean> = {
    time: Boolean(event.time),
    client: Boolean(event.clientName || event.clientPhone),
    place: Boolean(event.place),
    charge: Boolean(event.total),
    return: event.needsReturn,
    guarantee: Boolean(event.guarantee),
    notes: Boolean(event.notes),
  }
  return BLOCKS.filter((block) => filled[block])
}

function Fields({ initial, onClose, onSaved }: { initial?: AgendaEvent } & Omit<EventFormProps, 'target'>) {
  const { copy } = useAgendaConfig()
  const save = useSaveEvent(initial?.id)
  const recordPayment = useRecordPayment()
  const events = useEvents()

  const today = dayFromToday(0)
  const tomorrow = dayFromToday(1)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [pickingDate, setPickingDate] = useState(
    () => Boolean(initial) && initial?.date !== today && initial?.date !== tomorrow
  )
  const [time, setTime] = useState(initial?.time ?? '')
  const [clientName, setClientName] = useState(initial?.clientName ?? '')
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? '')
  const [place, setPlace] = useState(initial?.place ?? '')
  const [totalText, setTotalText] = useState(initial?.total ? String(initial.total) : '')
  const [advanceText, setAdvanceText] = useState('')
  const [chosenMethod, setChosenMethod] = useState(readMethod)
  const [guarantee, setGuarantee] = useState(initial?.guarantee ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [open, setOpen] = useState<Block[]>(() => (initial ? usedBlocks(initial) : readBlocks()))
  /** El bloque recién agregado recibe el cursor. */
  const [justAdded, setJustAdded] = useState<Block | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const charging = open.includes('charge')
  const total = charging ? toAmount(totalText) : 0
  // El anticipo solo se pide al agendar; después los pagos se anotan en el detalle
  const advance = charging && !initial ? toAmount(advanceText) : 0
  const methods = usePaymentMethods(advance > 0)
  const methodId = (methods.data?.find((m) => m.id === chosenMethod) ?? methods.data?.[0])?.id ?? ''

  const badAmount = (value: number) => Number.isNaN(value) || value > LIMITS.maxAmount
  const errors = {
    title: title.trim() ? '' : 'Escribe qué vas a agendar',
    date: date ? '' : 'Elige el día',
    total: badAmount(total) ? 'Revisa cuánto vas a cobrar' : '',
    advance: badAmount(advance)
      ? 'Revisa el anticipo'
      : advance > 0 && !total
        ? 'Escribe cuánto vas a cobrar en total'
        : advance > total
          ? 'El anticipo no puede ser mayor que el total'
          : '',
    method: advance > 0 && !methodId ? 'Elige cómo te dio el anticipo' : '',
  }

  const guarantees = [
    ...new Set(
      [...(events.data ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .flatMap((e) => (e.guarantee ? [e.guarantee] : []))
    ),
  ]
    .filter((text) => text !== guarantee)
    .slice(0, SUGGESTIONS)

  const add = (block: Block) => {
    setOpen((blocks) => [...blocks, block])
    setJustAdded(block)
  }

  const remove = (block: Block) => {
    setOpen((blocks) => blocks.filter((b) => b !== block))
    if (block === 'time') setTime('')
    if (block === 'place') setPlace('')
    if (block === 'guarantee') setGuarantee('')
    if (block === 'notes') setNotes('')
    if (block === 'client') {
      setClientName('')
      setClientPhone('')
    }
    if (block === 'charge') {
      setTotalText('')
      setAdvanceText('')
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const problem = Object.values(errors).find(Boolean)
    if (problem) {
      toast.error(problem)
      return
    }
    // Lo que no está abierto no se guarda
    const kept = <T,>(block: Block, value: T) => (open.includes(block) ? value : undefined)
    const clean = (value: string) => value.trim() || undefined
    save.mutate(
      {
        title: title.trim(),
        date,
        time: kept('time', time || undefined),
        clientName: kept('client', clean(clientName)),
        clientPhone: kept('client', clean(clientPhone)),
        place: kept('place', clean(place)),
        total: total > 0 ? total : undefined,
        needsReturn: open.includes('return'),
        guarantee: kept('guarantee', clean(guarantee)),
        notes: kept('notes', clean(notes)),
      },
      {
        onSuccess: async (event) => {
          // Solo lo nuevo cambia lo que sale abierto: corregir algo antiguo no es un hábito
          if (!initial) rememberBlocks(open)
          if (advance > 0) {
            try {
              await recordPayment.mutateAsync({ event, payment: { amount: advance, methodId, date: today } })
              rememberMethod(methodId)
              toast.success('Agendado y anticipo anotado en Caja')
            } catch {
              // Lo agendado ya quedó guardado: se cierra para no duplicarlo al reintentar
              toast.error('Se agendó, pero el anticipo no se anotó. Anótalo desde el detalle.', { duration: 10_000 })
            }
          } else {
            toast.success(initial ? 'Cambios guardados' : 'Agendado')
          }
          onSaved(event)
        },
        onError: () => toast.error(copy.saveError),
      }
    )
  }

  const saving = save.isPending || recordPayment.isPending

  const dayOption = (selected: boolean) =>
    cn(
      'h-11 rounded-xl px-4 text-[15px]',
      selected && 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
    )

  const section = (block: Block, children: ReactNode) =>
    open.includes(block) && (
      <div key={block} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={LABEL}>{BLOCK_INFO[block].label}</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-my-2 -mr-2 size-11 rounded-full text-muted-foreground"
            aria-label={`Quitar ${BLOCK_INFO[block].label.toLowerCase()}`}
            onClick={() => remove(block)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    )

  const closed = BLOCKS.filter((block) => !open.includes(block))

  return (
    <AppBottomSheet
      open
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={initial ? 'Corregir' : 'Agendar'}
      mobileHeight="92dvh"
      footer={
        <Button type="submit" form={FORM_ID} className={cn(TOUCH, 'w-full text-base')} disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {initial ? 'Guardar cambios' : 'Agendar'}
        </Button>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="agenda-title" className={LABEL}>
            ¿Qué es?
          </label>
          <Input
            id="agenda-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Pastel de cumpleaños"
            maxLength={LIMITS.title}
            autoCapitalize="sentences"
            autoComplete="off"
            autoFocus={!initial}
            aria-invalid={submitted && Boolean(errors.title)}
            className="h-14 text-lg md:text-lg"
          />
          {submitted && errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div role="group" aria-label="¿Cuándo?" className="space-y-2">
          <h3 className={LABEL}>¿Cuándo?</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Hoy', value: today },
              { label: 'Mañana', value: tomorrow },
            ].map((option) => (
              <Button
                key={option.label}
                type="button"
                variant="outline"
                aria-pressed={!pickingDate && date === option.value}
                onClick={() => {
                  setDate(option.value)
                  setPickingDate(false)
                }}
                className={dayOption(!pickingDate && date === option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              aria-pressed={pickingDate}
              onClick={() => setPickingDate(true)}
              className={dayOption(pickingDate)}
            >
              Otro día
            </Button>
          </div>
          {pickingDate && (
            <Input
              type="date"
              aria-label="Día"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 text-base"
            />
          )}
          {submitted && errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>

        {section(
          'time',
          <Input
            type="time"
            aria-label="Hora"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            autoFocus={justAdded === 'time'}
            className="h-12 text-base"
          />
        )}

        {section(
          'client',
          <div className="space-y-2">
            <Input
              aria-label="Nombre del cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre"
              maxLength={LIMITS.clientName}
              autoCapitalize="words"
              autoComplete="off"
              autoFocus={justAdded === 'client'}
              className="h-12 text-base"
            />
            <Input
              aria-label="Teléfono del cliente"
              inputMode="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Teléfono (para llamar o mandar WhatsApp)"
              maxLength={LIMITS.clientPhone}
              autoComplete="off"
              className="h-12 text-base"
            />
          </div>
        )}

        {section(
          'place',
          <Input
            aria-label="Lugar"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Dirección o lugar"
            maxLength={LIMITS.place}
            autoCapitalize="sentences"
            autoComplete="off"
            autoFocus={justAdded === 'place'}
            className="h-12 text-base"
          />
        )}

        {section(
          'charge',
          <div className="space-y-4">
            <AmountInput
              id="agenda-total"
              label="¿Cuánto vas a cobrar? ($)"
              value={totalText}
              onChange={setTotalText}
              autoFocus={justAdded === 'charge'}
              error={submitted ? errors.total : ''}
            />
            {initial ? (
              initial.paid > 0 && (
                <p className="text-sm text-muted-foreground">Ya cobrado: {formatCurrency(initial.paid)}</p>
              )
            ) : (
              <AmountInput
                id="agenda-advance"
                label="¿Dejó anticipo? ($)"
                placeholder="Opcional"
                value={advanceText}
                onChange={setAdvanceText}
                error={submitted ? errors.advance : ''}
              />
            )}
            {advance > 0 && (
              <MethodChips
                label="¿Cómo te dio el anticipo?"
                methods={methods}
                value={methodId}
                onChange={setChosenMethod}
                error={submitted ? errors.method : ''}
              />
            )}
          </div>
        )}

        {section(
          'return',
          <p className="rounded-xl bg-muted/60 px-4 py-3 text-[15px] text-muted-foreground">
            Primero lo marcas como entregado y, cuando regrese, como devuelto.
          </p>
        )}

        {section(
          'guarantee',
          <div className="space-y-2">
            <Input
              aria-label="Garantía"
              value={guarantee}
              onChange={(e) => setGuarantee(e.target.value)}
              placeholder="Ej. INE, depósito de $500"
              maxLength={LIMITS.guarantee}
              autoCapitalize="sentences"
              autoComplete="off"
              autoFocus={justAdded === 'guarantee'}
              className="h-12 text-base"
            />
            {guarantees.length > 0 && (
              <div role="group" aria-label="Garantías usadas antes" className="flex flex-wrap gap-2">
                {guarantees.map((text) => (
                  <Button
                    key={text}
                    type="button"
                    variant="outline"
                    className="h-11 max-w-full rounded-xl px-4 text-[15px]"
                    onClick={() => setGuarantee(text)}
                  >
                    <span className="truncate">{text}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {section(
          'notes',
          <textarea
            aria-label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lo que no quieras olvidar"
            maxLength={LIMITS.notes}
            autoFocus={justAdded === 'notes'}
            className="flex min-h-24 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        )}

        {closed.length > 0 && (
          <div role="group" aria-label="Agregar datos" className="flex flex-wrap gap-1 border-t pt-3">
            {closed.map((block) => {
              const { label, icon: Icon } = BLOCK_INFO[block]
              return (
                <Button
                  key={block}
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl px-3 text-muted-foreground"
                  onClick={() => add(block)}
                >
                  <Plus aria-hidden="true" />
                  <Icon aria-hidden="true" />
                  {label}
                </Button>
              )
            })}
          </div>
        )}
      </form>
    </AppBottomSheet>
  )
}
