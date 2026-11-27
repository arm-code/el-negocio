"use client"

// Cómo monta el toolbox las entradas y salidas: datos en el navegador, sin cuenta.
import { CashProvider, type CashConfig } from "@el-negocio/tool-cash"
import { localCatalogStorage, localMovementsStorage } from "@/lib/cash-storage"
import { markToolUsed } from "@/lib/install"

const config: CashConfig = {
  movements: {
    ...localMovementsStorage,
    // Anotar algo es la señal de que la app le sirvió: buen momento para sugerir instalarla
    async create(input) {
      const movement = await localMovementsStorage.create(input)
      markToolUsed()
      return movement
    },
  },
  catalogs: localCatalogStorage,
  defaultCategory: { in: "cat-ventas", out: "cat-compras" },
  routes: { home: "/" },
  copy: {
    backLabel: "Volver a herramientas",
    description: "Lo que entra y sale de tu negocio, guardado en este dispositivo.",
    deleteWarning: "Se borrará por completo de este dispositivo y no podrás recuperarlo.",
    saveError: "No se pudo guardar. Revisa que tu navegador permita guardar datos.",
    deleteError: "No se pudo borrar. Revisa que tu navegador permita guardar datos.",
  },
}

export function CashToolbox({ children }: { children: React.ReactNode }) {
  return <CashProvider config={config}>{children}</CashProvider>
}
