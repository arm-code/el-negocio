"use client"

// `?agenda=<id>` empieza un documento con los datos de algo agendado; `?doc=<id>` abre
// uno ya hecho.
import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DocumentsHome } from "@el-negocio/tool-documents"
import { seedFromAgenda } from "@/lib/documents-from-agenda"

const never = () => () => {}

function Documents() {
    const params = useSearchParams()
    const router = useRouter()

    // Se lee una sola vez, al entrar
    const [start] = useState(() => {
        const eventId = params.get("agenda")
        return {
            startWith: eventId ? seedFromAgenda(eventId) : undefined,
            openId: params.get("doc") ?? undefined,
        }
    })

    // Ya leído: recargar la pantalla no debe repetir la acción
    useEffect(() => {
        if (params.size > 0) router.replace("/tools/documents", { scroll: false })
    }, [params, router])

    return <DocumentsHome {...start} />
}

export default function DocumentsPage() {
    // Lo agendado vive en el navegador: no se lee al dibujar en el servidor
    const inBrowser = useSyncExternalStore(never, () => true, () => false)
    return <Suspense>{inBrowser && <Documents />}</Suspense>
}
