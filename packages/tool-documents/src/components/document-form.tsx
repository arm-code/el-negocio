'use client'

// Formulario de un documento: lo propio y lo opcional va recogido.

import { useState, type FormEvent } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { Input } from '@el-negocio/ui/input'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { LABEL, TOUCH } from '@el-negocio/ui/detail'
import { parseAmount } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useBusinessDefaults, useDocument, useDocuments, useSaveDocument } from '../hooks/use-documents'
import { useDocumentsConfig } from '../provider'
import { newDraft } from '../lib/draft'
import { FIELDS, type FieldType } from '../lib/fields'
import { LIMITS } from '../lib/limits'
import { TEMPLATES, type TemplateField, type TemplateSection } from '../lib/templates'
import type { BusinessDocument, DocumentInput, DocumentKind, DocumentSeed, FieldKey } from '../types'
import { ItemsEditor, readRows, toRows } from './items-editor'

/** Qué se está capturando: uno nuevo de cierto formato, o la corrección de uno. */
export type FormTarget = { kind: DocumentKind; seed?: DocumentSeed } | { editId: string }

const FORM_ID = 'documents-form'

interface DocumentFormProps {
  target: FormTarget | null
  onClose: () => void
  onSaved: (document: BusinessDocument) => void
}

export function DocumentForm({ target, onClose, onSaved }: DocumentFormProps) {
  if (!target) return null
  if ('editId' in target) {
    return <EditDocument key={target.editId} id={target.editId} onClose={onClose} onSaved={onSaved} />
  }
  return <NewDocument key={target.kind} {...target} onClose={onClose} onSaved={onSaved} />
}

type Handlers = Omit<DocumentFormProps, 'target'>

function Waiting({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AppBottomSheet open onOpenChange={(open) => !open && onClose()} title={title}>
      {children}
    </AppBottomSheet>
  )
}

const skeleton = <Skeleton className="h-64 w-full rounded-xl" aria-busy="true" />

/** Espera lo que sirve para llenar de antemano y arma el borrador una sola vez. */
function NewDocument({ kind, seed, onClose, onSaved }: { kind: DocumentKind; seed?: DocumentSeed } & Handlers) {
  const documents = useDocuments()
  const defaults = useBusinessDefaults()
  const [draft, setDraft] = useState<DocumentInput | null>(null)

  if (!draft && documents.data && !defaults.isLoading) {
    setDraft(newDraft(kind, documents.data, defaults.data, seed))
  }

  if (draft) return <Fields draft={draft} onClose={onClose} onSaved={onSaved} />

  return (
    <Waiting title={TEMPLATES[kind].name} onClose={onClose}>
      {documents.isError ? (
        <InlineError message="No se pudo preparar el documento." onRetry={() => documents.refetch()} />
      ) : (
        skeleton
      )}
    </Waiting>
  )
}

/** Lee el documento recién consultado antes de dejar corregirlo. */
function EditDocument({ id, onClose, onSaved }: { id: string } & Handlers) {
  const { data, isFetchedAfterMount, isError, refetch } = useDocument(id)
  const [initial, setInitial] = useState<BusinessDocument | null>(null)

  if (!initial && data && isFetchedAfterMount && !isError) setInitial(data)

  if (initial) return <Fields draft={initial} editId={initial.id} onClose={onClose} onSaved={onSaved} />

  return (
    <Waiting title="Corregir" onClose={onClose}>
      {!isFetchedAfterMount ? (
        skeleton
      ) : isError ? (
        <InlineError message="No se pudo cargar." onRetry={() => refetch()} />
      ) : (
        <p className="py-8 text-center text-muted-foreground">Ya no existe. Puede que se haya borrado.</p>
      )}
    </Waiting>
  )
}

const fieldId = (key: FieldKey) => `documents-${key}`

function problemWith({ key, required, label }: TemplateField, value: string): string {
  const { type } = FIELDS[key]
  const name = label ?? FIELDS[key].label
  if (!value.trim()) return required ? `Falta: ${name}` : ''
  if (type === 'money') {
    const amount = parseAmount(value)
    if (!(amount > 0 && amount <= LIMITS.maxAmount)) return `Revisa: ${name}`
  }
  if (type === 'percent' && !(parseAmount(value) >= 0 && parseAmount(value) <= 100)) return `Revisa: ${name}`
  if (type === 'number' && !/^\d{1,4}$/.test(value.trim())) return `Revisa: ${name}`
  return ''
}

/** Como se guarda: las cantidades sin comas ni signos. */
function clean(type: FieldType, value: string) {
  const text = value.trim()
  if (text && (type === 'money' || type === 'percent')) return String(Math.round(parseAmount(text) * 100) / 100)
  return text
}

function Fields({ draft, editId, onClose, onSaved }: { draft: DocumentInput; editId?: string } & Handlers) {
  const { copy } = useDocumentsConfig()
  const save = useSaveDocument(editId)
  const template = TEMPLATES[draft.kind]

  const [values, setValues] = useState(draft.values)
  const [rows, setRows] = useState(() => toRows(draft.items))
  const [submitted, setSubmitted] = useState(false)
  // Abiertas: las que piden algo que falta o ya traen datos opcionales
  const [open, setOpen] = useState<string[]>(() =>
    template.sections
      .filter((section) => {
        if (section.own) return section.fields.some((f) => f.required && !draft.values[f.key])
        if (section.optional) return Boolean(editId) && section.fields.some((f) => draft.values[f.key])
        return true
      })
      .map((section) => section.title)
  )

  const fields = template.sections.flatMap((section) => section.fields)
  const errors = new Map(fields.map((field) => [field.key, problemWith(field, values[field.key] ?? '')]))
  const advance = parseAmount(values.advance ?? '')
  if (!errors.get('advance') && advance > parseAmount(values.amount ?? '')) {
    errors.set('advance', 'El anticipo no puede ser mayor que el precio')
  }
  const list = template.items ? readRows(rows, template.items) : { items: [], error: '' }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    const wrong = fields.find((field) => errors.get(field.key))
    if (wrong) {
      const section = template.sections.find((s) => s.fields.includes(wrong))!
      setOpen((current) => [...new Set([...current, section.title])])
      toast.error(errors.get(wrong.key)!)
      return
    }
    if (list.error) {
      toast.error(list.error)
      return
    }
    const cleaned = Object.fromEntries(
      fields.map((field) => [field.key, clean(FIELDS[field.key].type, values[field.key] ?? '')]).filter(([, v]) => v)
    )
    save.mutate(
      { kind: draft.kind, values: cleaned, items: list.items, eventId: draft.eventId },
      {
        onSuccess: (document) => {
          toast.success(editId ? 'Cambios guardados' : 'Documento listo')
          onSaved(document)
        },
        onError: () => toast.error(copy.saveError),
      }
    )
  }

  const field = ({ key, label, required, placeholder }: TemplateField) => {
    const info = FIELDS[key]
    const error = submitted ? errors.get(key) : ''
    const common = {
      id: fieldId(key),
      value: values[key] ?? '',
      onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value })),
      placeholder: placeholder ?? info.placeholder,
      'aria-invalid': Boolean(error),
    }
    return (
      <div key={key} className="space-y-1.5">
        <label htmlFor={fieldId(key)} className={cn(LABEL, 'block')}>
          {label ?? info.label}
          {!required && <span className="sr-only"> (opcional)</span>}
        </label>
        {info.type === 'long' ? (
          <textarea
            {...common}
            maxLength={LIMITS.longText}
            autoCapitalize="sentences"
            className="flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
        ) : (
          <Input
            {...common}
            type={info.type === 'date' ? 'date' : 'text'}
            inputMode={
              info.type === 'money' || info.type === 'percent'
                ? 'decimal'
                : info.type === 'number'
                  ? 'numeric'
                  : info.type === 'phone'
                    ? 'tel'
                    : undefined
            }
            maxLength={info.type === 'date' ? undefined : LIMITS.text}
            autoComplete="off"
            className="h-12 text-base"
          />
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  const section = ({ title, fields, own, optional }: TemplateSection) => {
    const isOpen = open.includes(title)
    if (!own && !optional) {
      return (
        <div key={title} className="space-y-4">
          <h3 className="text-base font-semibold">{title}</h3>
          {fields.map(field)}
        </div>
      )
    }
    return (
      <div key={title} className="space-y-4 border-t pt-2">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setOpen((current) => (isOpen ? current.filter((t) => t !== title) : [...current, title]))}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span>
            <span className="block text-base font-semibold">{title}</span>
            {own && !isOpen && values.ownerName && (
              <span className="block truncate text-sm text-muted-foreground">{values.ownerName}</span>
            )}
          </span>
          <ChevronDown className={cn('size-5 shrink-0 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {isOpen && fields.map(field)}
      </div>
    )
  }

  // Los artículos van antes de lo opcional y de los datos propios
  const main = template.sections.filter((s) => !s.own && !s.optional)
  const rest = template.sections.filter((s) => s.own || s.optional)

  return (
    <AppBottomSheet
      open
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={template.name}
      mobileHeight="92dvh"
      footer={
        <Button type="submit" form={FORM_ID} className={cn(TOUCH, 'w-full text-base')} disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {editId ? 'Guardar cambios' : 'Ver el documento'}
        </Button>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
        {main.map(section)}
        {template.items && (
          <ItemsEditor info={template.items} rows={rows} onChange={setRows} error={submitted ? list.error : ''} />
        )}
        {rest.map(section)}
        <p className="text-pretty text-sm text-muted-foreground">
          Es un formato de apoyo. Para montos grandes, pide a un abogado que lo revise.
        </p>
      </form>
    </AppBottomSheet>
  )
}
