'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { EventsStorage } from './ports'

export interface AgendaRoutes {
  /** A dónde lleva el enlace para salir de la herramienta. */
  home: string
}

/** Textos que dependen de la aplicación o de dónde guarda los datos. */
export interface AgendaCopy {
  /** Texto del enlace a `routes.home`. */
  backLabel: string
  /** Subtítulo de la pantalla principal. */
  description: string
  /** Advertencia al confirmar un borrado. */
  deleteWarning: string
  saveError: string
  deleteError: string
}

/** Todo lo que la aplicación le entrega a la micro-app. */
export interface AgendaConfig {
  events: EventsStorage
  routes: AgendaRoutes
  copy: AgendaCopy
}

const AgendaContext = createContext<AgendaConfig | null>(null)

/** `config` debe ser estable entre renders (p. ej. una constante de módulo). */
export function AgendaProvider({ config, children }: { config: AgendaConfig; children: ReactNode }) {
  return <AgendaContext.Provider value={config}>{children}</AgendaContext.Provider>
}

export function useAgendaConfig(): AgendaConfig {
  const config = useContext(AgendaContext)
  if (!config) throw new Error('Falta <AgendaProvider> alrededor de la micro-app de agenda.')
  return config
}
