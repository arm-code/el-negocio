'use client'

// Los documentos hechos para algo agendado, para ponerlos en su detalle. La aplicación
// decide a dónde lleva cada enlace.

import Link from 'next/link'
import { ChevronRight, FilePlus2 } from 'lucide-react'
import { Button } from '@el-negocio/ui/button'
import { Skeleton } from '@el-negocio/ui/skeleton'
import { InlineError } from '@el-negocio/ui/states'
import { DetailSection, TOUCH } from '@el-negocio/ui/detail'
import { cn } from '@el-negocio/ui/utils'
import { useDocuments } from '../hooks/use-documents'
import { folioText } from '../lib/format'
import { templateName } from '../lib/templates'

interface LinkedDocumentsProps {
  eventId: string
  /** A dónde ir para ver un documento. */
  openHref: (documentId: string) => string
  /** A dónde ir para hacer uno; sin esto no se ofrece. */
  newHref?: string
}

export function LinkedDocuments({ eventId, openHref, newHref }: LinkedDocumentsProps) {
  const { data, isError, refetch } = useDocuments()
  const linked = (data ?? []).filter((d) => d.eventId === eventId).sort((a, b) => b.folio - a.folio)
  if (data && linked.length === 0 && !newHref) return null

  return (
    <DetailSection title="Documentos">
      {isError ? (
        <InlineError message="No se pudieron cargar los documentos." onRetry={() => refetch()} />
      ) : !data ? (
        <Skeleton className="h-11 w-full rounded-xl" />
      ) : (
        linked.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {linked.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={openHref(doc.id)}
                  className="flex min-h-12 items-center gap-3 px-4 py-2 outline-none focus-visible:bg-accent active:bg-accent"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {templateName(doc.kind)} · {folioText(doc.folio)}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
      {newHref && (
        <Button asChild variant="outline" className={cn(TOUCH, 'w-full')}>
          <Link href={newHref}>
            <FilePlus2 aria-hidden="true" />
            Hacer contrato o pagaré
          </Link>
        </Button>
      )}
    </DetailSection>
  )
}
