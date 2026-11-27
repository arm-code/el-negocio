'use client'

// Hoja para anotar un movimiento o corregir uno que ya existe.

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { LABEL, TOUCH } from '@el-negocio/ui/detail'
import { formatCurrency, parseAmount, toLocalDateInput } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useCatalog, useMovement, useSaveMovement } from '../hooks/use-cash'
import { useCashConfig } from '../provider'
import { LIMITS } from '../lib/limits'
import { readPrefs, rememberUse, type Prefs } from '../lib/prefs'
import type { CatalogItem, Movement, MovementKind } from '../types'
import { OptionChips } from './option-chips'
import { DateAndDetail } from './date-and-detail'

/** Qué se está capturando: uno nuevo de cierto tipo, o la corrección de uno. */
export type FormTarget = { kind: MovementKind } | { editId: string }

const KINDS: readonly { value: MovementKind; label: string; selected: string; amountFocus: string }[] = [
  {
    value: 'in',
    label: 'Entró',
    selected: 'border-success bg-success/10 text-success hover:bg-success/15 hover:text-success',
    // El campo de la cantidad toma el color del tipo: el acento de la app puede ser
    // rojizo y parecer que el dinero sale
    amountFocus: 'focus-visible:border-success focus-visible:ring-success/40',
  },
  {
    value: 'out',
    label: 'Salió',
    selected: 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive',
    amountFocus: 'focus-visible:border-destructive focus-visible:ring-destructive/40',
  },
]

const FORM_ID = 'cash-movement-form'

/** Si lo que se corrige usa una opción que ya no se ofrece, se muestra de todos modos. */
function withSaved(items: CatalogItem[] | undefined, saved?: CatalogItem) {
  if (!items) return []
  return saved && !items.some((i) => i.id === saved.id) ? [saved, ...items] : items
}

interface MovementFormProps {
  target: FormTarget | null
  onClose: () => void
  onSaved: (movement: Movement) => void
}

export function MovementForm({ target, onClose, onSaved }: MovementFormProps) {
  if (!target) return null
  if ('editId' in target) {
    return <EditMovement key={target.editId} id={target.editId} onClose={onClose} onSaved={onSaved} />
  }
  return <Fields startKind={target.kind} onClose={onClose} onSaved={onSaved} />
}

/** Lee el movimiento recién consultado antes de dejar corregirlo. */
function EditMovement({ id, onClose, onSaved }: { id: string } & Omit<MovementFormProps, 'target'>) {
  const { data, isFetchedAfterMount, isError, refetch } = useMovement(id)
  const [initial, setInitial] = useState<Movement | null>(null)

  // Se queda con la primera lectura fresca: si una posterior falla, no se pierde
  // lo que se está capturando
  if (!initial && data && isFetchedAfterMount && !isError) setInitial(data)

  if (initial) return <Fields initial={initial} startKind={initial.kind} onClose={onClose} onSaved={onSaved} />

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

interface FieldsProps extends Omit<MovementFormProps, 'target'> {
  initial?: Movement
  startKind: MovementKind
}

function Fields({ initial, startKind, onClose, onSaved }: FieldsProps) {
  const { copy, defaultCategory } = useCashConfig()
  const categories = useCatalog('category')
  const methods = useCatalog('method')
  const save = useSaveMovement(initial?.id)

  const [prefs] = useState<Prefs>(readPrefs)
  const [kind, setKind] = useState<MovementKind>(startKind)
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '')
  const [chosenCategory, setChosenCategory] = useState(initial?.category.id ?? '')
  const [chosenMethod, setChosenMethod] = useState(initial?.method.id ?? '')
  const [date, setDate] = useState(initial?.date ?? toLocalDateInput())
  const [description, setDescription] = useState(initial?.description ?? '')
  const [submitted, setSubmitted] = useState(false)

  // Primero las usadas recientemente según si entra o sale, y la que propone la app
  const preferred = [...new Set([...(prefs.recent?.[kind] ?? []), defaultCategory?.[kind]])]
  const categoryItems = withSaved(categories.data, initial?.category)
  const orderedCategories = [
    ...preferred.flatMap((id) => categoryItems.filter((c) => c.id === id)),
    ...categoryItems.filter((c) => !preferred.includes(c.id)),
  ]
  // Siempre hay una preelegida: al capturar varias seguidas casi nunca cambia
  const categoryId = chosenCategory || orderedCategories[0]?.id || ''
  const methodItems = withSaved(methods.data, initial?.method)
  // Forma de pago preelegida: la última usada o la primera
  const methodId =
    chosenMethod || (methodItems.find((m) => m.id === prefs.methodId) ?? methodItems[0])?.id || ''

  const amount = Math.round(parseAmount(amountText) * 100) / 100
  const errors = {
    amount: !(amount > 0)
      ? 'Escribe cuánto fue, por ejemplo 150 o 150.50'
      : amount > LIMITS.maxAmount
        ? 'Revisa la cantidad, parece demasiado alta'
        : '',
    category: categoryId ? '' : 'Elige una categoría',
    method: methodId ? '' : 'Elige cómo se pagó',
    // Una fecha futura que ya estaba guardada se respeta mientras no se cambie
    date: !date
      ? 'Elige la fecha'
      : date > toLocalDateInput() && date !== initial?.date
        ? 'No se puede anotar una fecha futura'
        : '',
  }
  const shown = (message: string) => (submitted && message ? message : undefined)
  const verb = kind === 'in' ? 'entrada' : 'salida'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const problem = Object.values(errors).find(Boolean)
    if (problem) {
      toast.error(problem)
      return
    }
    save.mutate(
      { kind, amount, date, categoryId, methodId, description: description.trim() || undefined },
      {
        onSuccess: (movement) => {
          // Solo lo nuevo cambia lo preelegido: corregir algo antiguo no es un hábito
          if (!initial) rememberUse(kind, categoryId, methodId)
          toast.success(initial ? 'Cambios guardados' : kind === 'in' ? 'Entrada guardada' : 'Salida guardada')
          onSaved(movement)
        },
        onError: () => toast.error(copy.saveError),
      }
    )
  }

  return (
    <AppBottomSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={initial ? 'Corregir' : `Anotar ${verb}`}
      footer={
        <Button type="submit" form={FORM_ID} className={cn(TOUCH, 'w-full text-base')} disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {amount > 0 ? `Guardar ${verb} de ${formatCurrency(amount)}` : `Guardar ${verb}`}
        </Button>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
        <div role="group" aria-label="¿Entró o salió dinero?" className="grid grid-cols-2 gap-2">
          {KINDS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              aria-pressed={kind === option.value}
              onClick={() => setKind(option.value)}
              className={cn(TOUCH, 'text-base font-semibold', kind === option.value && option.selected)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="cash-amount" className={LABEL}>
            ¿Cuánto? ($)
          </label>
          <Input
            id="cash-amount"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            maxLength={14}
            autoComplete="off"
            autoFocus={!initial}
            aria-invalid={Boolean(shown(errors.amount))}
            className={cn(
              'h-16 text-center text-3xl font-semibold tabular-nums md:text-3xl',
              KINDS.find((option) => option.value === kind)?.amountFocus
            )}
          />
          {shown(errors.amount) && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>

        <OptionChips
          kind="category"
          label="¿De qué fue?"
          newLabel="Nueva categoría"
          items={orderedCategories}
          isLoading={categories.isLoading}
          value={categoryId}
          onChange={setChosenCategory}
          error={shown(errors.category)}
        />

        <OptionChips
          kind="method"
          label="¿Cómo se pagó?"
          newLabel="Nueva forma de pago"
          items={methodItems}
          isLoading={methods.isLoading}
          value={methodId}
          onChange={setChosenMethod}
          error={shown(errors.method)}
        />

        {(categories.isError || methods.isError) && (
          <InlineError
            message="No se pudieron cargar las opciones."
            onRetry={() => {
              categories.refetch()
              methods.refetch()
            }}
          />
        )}

        <DateAndDetail
          date={date}
          onDateChange={setDate}
          dateError={shown(errors.date)}
          description={description}
          onDescriptionChange={setDescription}
        />
      </form>
    </AppBottomSheet>
  )
}
