'use client'

// `?agenda=<id>` empieza un documento con los datos de algo agendado; `?doc=<id>` abre
// uno ya hecho.
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { DocumentsHome } from '@el-negocio/tool-documents'
import { ListSkeleton } from '@/components/ui/states'
import { seedFromAgenda } from '@/lib/documents-from-agenda'

const PATH = '/tools/documentos'

function Documentos() {
  const params = useSearchParams()
  const router = useRouter()
  // Se lee una sola vez, al entrar
  const [start] = useState(() => ({ eventId: params.get('agenda'), openId: params.get('doc') ?? undefined }))

  const seed = useQuery({
    queryKey: ['agenda', 'document-seed', start.eventId],
    queryFn: () => seedFromAgenda(start.eventId!),
    enabled: Boolean(start.eventId),
    // Lo recién anotado, y sin reintentos: si falla se empieza en blanco
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  // Ya leído: recargar la pantalla no debe repetir la acción
  useEffect(() => {
    if (params.size > 0) router.replace(PATH, { scroll: false })
  }, [params, router])

  if (start.eventId && seed.isLoading) return <ListSkeleton label="Preparando el documento" />

  return <DocumentsHome startWith={seed.data ?? undefined} openId={start.openId} />
}

export default function DocumentosPage() {
  return (
    <Suspense>
      <Documentos />
    </Suspense>
  )
}
