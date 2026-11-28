'use client'

// Lo que El Negocio OS agrega al detalle de algo agendado: sus documentos, su nota de
// venta y el contrato de servicio que el negocio ya usaba.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AgendaEvent } from '@el-negocio/tool-agenda'
import { LinkedDocuments } from '@el-negocio/tool-documents'
import { DetailSection } from '@/components/ui/detail'
import { Skeleton } from '@/components/ui/skeleton'
import { InlineError } from '@/components/ui/states'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentActions } from '@/components/documents/document-actions'
import { PrintEventContractDocument } from '@/components/documents/event-contract-document'
import { TO_API } from '@/lib/agenda-storage'
import { financeApi } from '@/lib/api/finance'
import { apiNotesStorage } from '@/lib/sales-notes-storage'
import { defaultBusinessConfig } from '@/lib/config'
import { toSlug } from '@/lib/display'

const NONE = 'none'

export function AgendaExtras({ event }: { event: AgendaEvent }) {
  const queryClient = useQueryClient()

  // Bajo 'agenda' para que se refresque junto con lo agendado
  const linkKey = ['agenda', 'note-link', event.id]
  const link = useQuery({
    queryKey: linkKey,
    queryFn: async () => (await financeApi.getBusinessEventById(event.id)).noteId ?? null,
    staleTime: 0,
  })
  const notes = useQuery({
    // Bajo 'salesNotes' para que se refresque al guardar o borrar una nota
    queryKey: ['salesNotes', 'event-link'],
    queryFn: () => apiNotesStorage.list(),
  })
  const config = useQuery({ queryKey: ['businessConfig'], queryFn: () => financeApi.getConfig() })

  const save = useMutation({
    mutationFn: (noteId: string | null) => financeApi.linkEventNote(event.id, noteId),
    onSuccess: async (_, noteId) => {
      queryClient.setQueryData(linkKey, noteId)
      await queryClient.invalidateQueries({ queryKey: ['salesNotes'] })
      toast.success(noteId ? 'Nota ligada' : 'Nota desligada')
    },
    onError: () => toast.error('No se pudo cambiar la nota. Revisa tu conexión.'),
  })

  const linked = notes.data?.find((n) => n.id === link.data)

  return (
    <>
      <LinkedDocuments
        eventId={event.id}
        openHref={(id) => `/tools/documentos?doc=${encodeURIComponent(id)}`}
        newHref={
          event.status === 'cancelled' ? undefined : `/tools/documentos?agenda=${encodeURIComponent(event.id)}`
        }
      />

      <DetailSection title="Nota de venta">
        {link.isError || notes.isError ? (
          <InlineError
            message="No se pudieron cargar tus notas."
            onRetry={() => {
              link.refetch()
              notes.refetch()
            }}
          />
        ) : link.data === undefined || !notes.data ? (
          <Skeleton className="h-11 w-full rounded-xl" />
        ) : (
          <Select
            value={link.data ?? NONE}
            onValueChange={(value) => save.mutate(value === NONE ? null : value)}
            disabled={save.isPending}
          >
            <SelectTrigger aria-label="Nota de venta ligada" className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin nota</SelectItem>
              {notes.data.map((note) => (
                <SelectItem key={note.id} value={note.id}>
                  {note.folio} — {note.customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DetailSection>

      <DetailSection title="Contrato de servicio">
        <DocumentActions
          placement="inline"
          filename={`contrato-${toSlug(event.clientName ?? event.title, 'evento')}`}
          exportNode={
            <PrintEventContractDocument
              business={config.data || defaultBusinessConfig}
              event={{
                id: event.id,
                folio: event.folio,
                name: event.title,
                cost: event.total ?? 0,
                date: event.date,
                clientName: event.clientName,
                clientPhone: event.clientPhone,
                eventAddress: event.place,
                status: TO_API[event.status],
                guaranteeDocument: event.guarantee,
                notes: event.notes,
                noteFolio: linked?.folio,
              }}
            />
          }
        />
      </DetailSection>
    </>
  )
}
