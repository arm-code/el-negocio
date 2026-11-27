"use client"

// Cómo monta el toolbox los contratos y pagarés: datos en el navegador, sin cuenta.
import { DocumentsProvider, type DocumentsConfig } from "@el-negocio/tool-documents"
import { businessDefaults, localDocumentsStorage } from "@/lib/documents-storage"
import { markToolUsed } from "@/lib/install"

const config: DocumentsConfig = {
    documents: {
        ...localDocumentsStorage,
        // Hacer un documento es la señal de que la app le sirvió: buen momento para sugerir instalarla
        async create(input) {
            const document = await localDocumentsStorage.create(input)
            markToolUsed()
            return document
        },
    },
    defaults: businessDefaults,
    routes: { home: "/" },
    copy: {
        backLabel: "Volver a herramientas",
        description: "Tus documentos, guardados en este dispositivo.",
        deleteWarning: "Se borrará por completo de este dispositivo y no podrás recuperarlo. Su folio no se vuelve a usar.",
        saveError: "No se pudo guardar. Revisa que tu navegador permita guardar datos.",
        deleteError: "No se pudo borrar. Revisa que tu navegador permita guardar datos.",
    },
}

export function DocumentsToolbox({ children }: { children: React.ReactNode }) {
    return <DocumentsProvider config={config}>{children}</DocumentsProvider>
}
