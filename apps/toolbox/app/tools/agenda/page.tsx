"use client"

import { AgendaHome } from "@el-negocio/tool-agenda"
import { LinkedDocuments } from "@el-negocio/tool-documents"

export default function AgendaPage() {
    return (
        <AgendaHome
            renderExtra={(event) => (
                <LinkedDocuments
                    eventId={event.id}
                    openHref={(id) => `/tools/documents?doc=${encodeURIComponent(id)}`}
                    newHref={
                        event.status === "cancelled" ? undefined : `/tools/documents?agenda=${encodeURIComponent(event.id)}`
                    }
                />
            )}
        />
    )
}
