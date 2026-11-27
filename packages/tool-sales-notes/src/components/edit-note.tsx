'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RotateCw } from 'lucide-react'
import { useSalesNote } from '../hooks/use-sales-notes'
import { useSalesNotesConfig } from '../provider'
import type { Note } from '../types'
import { NoteWizard } from './note-wizard'
import { Button } from '@el-negocio/ui/button'
import { Card } from '@el-negocio/ui/card'
import { Skeleton } from '@el-negocio/ui/skeleton'

/** Carga la nota desde el storage y abre el asistente en modo edición. */
export function EditNote({ noteId }: { noteId: string }) {
  // key: si cambia la nota, se vuelve a cargar y el asistente empieza de cero
  return <LoadNote key={noteId} noteId={noteId} />
}

function LoadNote({ noteId }: { noteId: string }) {
  const { routes, copy } = useSalesNotesConfig()
  const { data: note, isFetchedAfterMount, isError, refetch } = useSalesNote(noteId)
  const [initialNote, setInitialNote] = useState<Note | null>(null)

  // El asistente se queda con la primera lectura fresca: si una posterior falla,
  // no se pierde lo que se está capturando.
  if (!initialNote && note && isFetchedAfterMount && !isError) setInitialNote(note)

  if (initialNote) return <NoteWizard initialNote={initialNote} />

  if (!isFetchedAfterMount) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-[15px] font-medium">No pudimos cargar esta nota</p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          <RotateCw aria-hidden="true" />
          Reintentar
        </Button>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-[15px] font-medium">No encontramos esta nota</p>
      <p className="text-sm text-muted-foreground">{copy.notFoundHint}</p>
      <Button asChild className="mt-2">
        <Link href={routes.list}>Ver mis notas</Link>
      </Button>
    </Card>
  )
}
