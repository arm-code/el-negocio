'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { CatalogStorage, MovementsStorage } from './ports'
import type { MovementKind } from './types'

export interface CashRoutes {
  /** A dónde lleva el enlace para salir de la herramienta. */
  home: string
}

/** Textos que dependen de la aplicación o de dónde guarda los datos. */
export interface CashCopy {
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
export interface CashConfig {
  movements: MovementsStorage
  catalogs: CatalogStorage
  routes: CashRoutes
  copy: CashCopy
  /** Categoría preelegida (por id) mientras la persona no haya usado otra. */
  defaultCategory?: Partial<Record<MovementKind, string>>
}

const CashContext = createContext<CashConfig | null>(null)

/** `config` debe ser estable entre renders (p. ej. una constante de módulo). */
export function CashProvider({ config, children }: { config: CashConfig; children: ReactNode }) {
  return <CashContext.Provider value={config}>{children}</CashContext.Provider>
}

export function useCashConfig(): CashConfig {
  const config = useContext(CashContext)
  if (!config) throw new Error('Falta <CashProvider> alrededor de la micro-app de entradas y salidas.')
  return config
}
