"use client"

// Cómo monta el toolbox la agenda: datos en el navegador, sin cuenta.
import { AgendaProvider, type AgendaConfig } from "@el-negocio/tool-agenda"
import { localEventsStorage, localPaymentsStorage } from "@/lib/agenda-storage"
import { markToolUsed } from "@/lib/install"

const config: AgendaConfig = {
  events: {
    ...localEventsStorage,
    // Agendar algo es la señal de que la app le sirvió: buen momento para sugerir instalarla
    async create(input) {
      const event = await localEventsStorage.create(input)
      markToolUsed()
      return event
    },
  },
  payments: localPaymentsStorage,
  routes: { home: "/", cash: "/tools/cash" },
  copy: {
    backLabel: "Volver a herramientas",
    description: "Tus citas, pedidos y entregas, guardados en este dispositivo.",
    deleteWarning: "Se borrará por completo de este dispositivo y no podrás recuperarlo.",
    saveError: "No se pudo guardar. Revisa que tu navegador permita guardar datos.",
    deleteError: "No se pudo borrar. Revisa que tu navegador permita guardar datos.",
  },
}

export function AgendaToolbox({ children }: { children: React.ReactNode }) {
  return <AgendaProvider config={config}>{children}</AgendaProvider>
}
