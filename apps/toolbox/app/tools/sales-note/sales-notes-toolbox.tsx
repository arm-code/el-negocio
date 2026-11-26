"use client"

// Cómo monta el toolbox las notas de venta: datos en el navegador, sin cuenta.
import { SalesNotesProvider, type SalesNotesConfig } from "@el-negocio/tool-sales-notes"
import { localBusinessInfoStorage, localNotesStorage } from "@/lib/sales-notes-storage"

const BASE = "/tools/sales-note"

const config: SalesNotesConfig = {
  notes: localNotesStorage,
  business: localBusinessInfoStorage,
  routes: {
    home: "/",
    list: BASE,
    create: `${BASE}/new`,
    // El id va como parámetro para que la pantalla sea estática y abra sin red
    edit: (id) => `${BASE}/edit?id=${encodeURIComponent(id)}`,
  },
  copy: {
    backLabel: "Volver a herramientas",
    listDescription: "Tus notas y cotizaciones, guardadas en este dispositivo.",
    deleteWarning: "Se borrará por completo de este dispositivo y no podrás recuperarla.",
    saveError: "No se pudo guardar la nota. Revisa que tu navegador permita guardar datos.",
    deleteError: "No se pudo eliminar el documento. Revisa que tu navegador permita guardar datos.",
    notFoundHint: "Puede que se haya borrado o que esté en otro dispositivo.",
  },
}

export function SalesNotesToolbox({ children }: { children: React.ReactNode }) {
  return <SalesNotesProvider config={config}>{children}</SalesNotesProvider>
}
