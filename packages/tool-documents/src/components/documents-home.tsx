'use client'

// Pantalla principal: los documentos hechos y la entrada para hacer otro.

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, FilePlus2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { Card } from '@el-negocio/ui/card'
import { PageHeader } from '@el-negocio/ui/page-header'
import { SearchInput } from '@el-negocio/ui/search-input'
import { MobileFab } from '@el-negocio/ui/mobile-fab'
import { ConfirmDialog } from '@el-negocio/ui/confirm-dialog'
import { EmptyState, InlineError, ListSkeleton } from '@el-negocio/ui/states'
import { TOUCH } from '@el-negocio/ui/detail'
import { normalizeSearch } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { useDeleteDocument, useDocuments } from '../hooks/use-documents'
import { useDocumentsConfig } from '../provider'
import { documentsMeta } from '../meta'
import { dateText, folioText, moneyText } from '../lib/format'
import { documentAmount, TEMPLATES } from '../lib/templates'
import { DOCUMENT_KINDS, type BusinessDocument, type DocumentKind, type DocumentSeed } from '../types'
import { DocumentForm, type FormTarget } from './document-form'
import { DocumentView } from './document-view'

/** Con pocos documentos, buscar es ruido. */
const SEARCH_MIN = 6

interface DocumentsHomeProps {
  /** Pide de una vez un documento nuevo con estos datos, p. ej. desde la agenda. */
  startWith?: DocumentSeed
  /** Abre de una vez este documento. */
  openId?: string
}

export function DocumentsHome({ startWith, openId }: DocumentsHomeProps) {
  const { routes, copy } = useDocumentsConfig()
  const { data: documents, isError, refetch } = useDocuments()
  const remove = useDeleteDocument()

  const [picking, setPicking] = useState(Boolean(startWith))
  const [seed, setSeed] = useState(startWith)
  const [form, setForm] = useState<FormTarget | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(openId ?? null)
  const [toDelete, setToDelete] = useState<BusinessDocument | null>(null)
  const [query, setQuery] = useState('')

  const selected = documents?.find((d) => d.id === selectedId) ?? null
  const search = normalizeSearch(query.trim())
  const visible = [...(documents ?? [])]
    .sort((a, b) => b.folio - a.folio)
    .filter(
      (d) =>
        !search ||
        normalizeSearch(`${folioText(d.folio)} ${TEMPLATES[d.kind].name} ${d.values.clientName ?? ''}`).includes(search)
    )
  const hasDocuments = (documents?.length ?? 0) > 0

  const startNew = () => {
    setSeed(undefined)
    setPicking(true)
  }

  function pick(kind: DocumentKind) {
    setPicking(false)
    setForm({ kind, seed })
  }

  function confirmDelete() {
    if (!toDelete) return
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Documento borrado')
        setToDelete(null)
      },
      onError: () => toast.error(copy.deleteError),
    })
  }

  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2 h-11 text-muted-foreground hover:text-foreground">
          <Link href={routes.home}>
            <ArrowLeft aria-hidden="true" />
            {copy.backLabel}
          </Link>
        </Button>
        <PageHeader
          title={documentsMeta.title}
          description={copy.description}
          action={
            hasDocuments && (
              <Button className={cn(TOUCH, 'hidden sm:inline-flex')} onClick={startNew}>
                <FilePlus2 aria-hidden="true" />
                Nuevo documento
              </Button>
            )
          }
        />
      </div>

      {isError ? (
        <InlineError message="No se pudieron cargar tus documentos." onRetry={() => refetch()} />
      ) : !documents ? (
        <ListSkeleton label="Cargando tus documentos" />
      ) : !hasDocuments ? (
        <EmptyState
          title="Haz tu primer documento"
          description="Pagarés y contratos: llenas los datos y sale listo para imprimir y firmar."
          action={
            <Button className="mt-2 h-14 rounded-2xl px-8 text-lg" onClick={startNew}>
              <FilePlus2 aria-hidden="true" />
              Nuevo documento
            </Button>
          }
        />
      ) : (
        <>
          {(documents.length >= SEARCH_MIN || query) && (
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o folio" />
          )}
          {visible.length === 0 ? (
            <EmptyState title="Nada coincide con tu búsqueda" />
          ) : (
            <Card className="gap-0 overflow-hidden py-0">
              <ul aria-label="Tus documentos" className="divide-y">
                {visible.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent active:bg-accent"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-medium">
                          {doc.values.clientName || 'Sin nombre'}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {TEMPLATES[doc.kind].name}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          Folio {folioText(doc.folio)} · {dateText(doc.values.date)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {moneyText(documentAmount(doc))}
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <MobileFab aria-label="Nuevo documento" title="Nuevo" onClick={startNew} />
        </>
      )}

      <AppBottomSheet open={picking} onOpenChange={setPicking} title="¿Qué vas a hacer?">
        <ul className="space-y-2">
          {DOCUMENT_KINDS.map((kind) => (
            <li key={kind}>
              <button
                type="button"
                onClick={() => pick(kind)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{TEMPLATES[kind].name}</span>
                  <span className="block text-pretty text-sm text-muted-foreground">{TEMPLATES[kind].hint}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </AppBottomSheet>

      <DocumentForm
        target={form}
        onClose={() => setForm(null)}
        onSaved={(doc) => {
          setForm(null)
          setQuery('')
          setSelectedId(doc.id)
        }}
      />

      <DocumentView
        document={form ? null : selected}
        onClose={() => setSelectedId(null)}
        onEdit={(doc) => {
          setSelectedId(null)
          setForm({ editId: doc.id })
        }}
        onDelete={(doc) => {
          setSelectedId(null)
          setToDelete(doc)
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`¿Borrar el folio ${toDelete ? folioText(toDelete.folio) : ''}?`}
        description={copy.deleteWarning}
        confirmText="Sí, borrar"
        onConfirm={confirmDelete}
        isPending={remove.isPending}
      />
    </div>
  )
}
