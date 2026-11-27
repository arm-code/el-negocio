'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DocumentsStorage } from './ports'
import type { DocumentValues } from './types'

export interface DocumentsRoutes {
  /** A dónde lleva el enlace para salir de la herramienta. */
  home: string
}

/** Textos que dependen de la aplicación o de dónde guarda los datos. */
export interface DocumentsCopy {
  backLabel: string
  description: string
  deleteWarning: string
  saveError: string
  deleteError: string
}

export interface DocumentsConfig {
  documents: DocumentsStorage
  routes: DocumentsRoutes
  copy: DocumentsCopy
  /** Datos del negocio que la aplicación ya conoce, para el primer documento. */
  defaults?: () => Promise<DocumentValues>
}

const DocumentsContext = createContext<DocumentsConfig | null>(null)

/** `config` debe ser estable entre renders (p. ej. una constante de módulo). */
export function DocumentsProvider({ config, children }: { config: DocumentsConfig; children: ReactNode }) {
  return <DocumentsContext.Provider value={config}>{children}</DocumentsContext.Provider>
}

export function useDocumentsConfig(): DocumentsConfig {
  const config = useContext(DocumentsContext)
  if (!config) throw new Error('Falta <DocumentsProvider> alrededor de la micro-app de documentos.')
  return config
}
