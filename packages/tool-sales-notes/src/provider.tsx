'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { BusinessInfoStorage, NotesStorage } from './ports'

export interface SalesNotesRoutes {
  /** A dónde lleva el enlace para salir de la herramienta. */
  home: string
  list: string
  create: string
  edit: (id: string) => string
}

/** Textos que dependen de la aplicación o de dónde guarda los datos. */
export interface SalesNotesCopy {
  /** Texto del enlace a `routes.home`. */
  backLabel: string
  /** Subtítulo de la pantalla principal. */
  listDescription: string
  /** Advertencia al confirmar un borrado. */
  deleteWarning: string
  saveError: string
  deleteError: string
  /** Por qué puede no encontrarse una nota. */
  notFoundHint: string
}

/** Todo lo que la aplicación le entrega a la micro-app. */
export interface SalesNotesConfig {
  notes: NotesStorage
  business: BusinessInfoStorage
  routes: SalesNotesRoutes
  copy: SalesNotesCopy
}

const SalesNotesContext = createContext<SalesNotesConfig | null>(null)

/** `config` debe ser estable entre renders (p. ej. una constante de módulo). */
export function SalesNotesProvider({ config, children }: { config: SalesNotesConfig; children: ReactNode }) {
  return <SalesNotesContext.Provider value={config}>{children}</SalesNotesContext.Provider>
}

export function useSalesNotesConfig(): SalesNotesConfig {
  const config = useContext(SalesNotesContext)
  if (!config) throw new Error('Falta <SalesNotesProvider> alrededor de la micro-app de notas de venta.')
  return config
}
