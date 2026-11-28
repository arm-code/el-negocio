'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocumentsConfig } from '../provider'
import type { DocumentInput } from '../types'

export const documentKeys = {
  all: ['documents'] as const,
  list: ['documents', 'list'] as const,
  document: (id: string) => ['documents', 'document', id] as const,
  defaults: ['documents', 'defaults'] as const,
}

/** Refresca cuando el almacenamiento avisa de un cambio hecho por fuera. */
function useExternalChanges() {
  const { documents } = useDocumentsConfig()
  const queryClient = useQueryClient()
  useEffect(
    () => documents.subscribe?.(() => queryClient.invalidateQueries({ queryKey: documentKeys.all })),
    [documents, queryClient]
  )
}

export function useDocuments() {
  const { documents } = useDocumentsConfig()
  useExternalChanges()
  return useQuery({
    queryKey: documentKeys.list,
    queryFn: () => documents.list(),
    staleTime: documents.staleTime ?? Infinity,
  })
}

export function useDocument(id: string) {
  const { documents } = useDocumentsConfig()
  return useQuery({
    queryKey: documentKeys.document(id),
    queryFn: () => documents.get(id),
    staleTime: documents.staleTime ?? Infinity,
    // Se corrige a partir de esta lectura: una copia vieja pisaría cambios más nuevos
    refetchOnMount: 'always',
  })
}

/** Datos del negocio para el primer documento. Si fallan, se empieza en blanco. */
export function useBusinessDefaults() {
  const { defaults } = useDocumentsConfig()
  return useQuery({
    queryKey: documentKeys.defaults,
    queryFn: async () => (await defaults?.()) ?? {},
    retry: false,
  })
}

function useRefresh() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: documentKeys.all })
}

export function useSaveDocument(id?: string) {
  const { documents } = useDocumentsConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: DocumentInput) => (id ? documents.update(id, input) : documents.create(input)),
    onSuccess: refresh,
  })
}

export function useDeleteDocument() {
  const { documents } = useDocumentsConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => documents.remove(id),
    onSuccess: refresh,
  })
}
