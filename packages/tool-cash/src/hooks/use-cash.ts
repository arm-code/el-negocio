'use client'

import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCashConfig } from '../provider'
import type { CatalogItem, CatalogKind, MovementInput, Period } from '../types'

export const cashKeys = {
  all: ['cash'] as const,
  list: (period: Period | null) => ['cash', 'list', period] as const,
  summary: (period: Period | null) => ['cash', 'summary', period] as const,
  movement: (id: string) => ['cash', 'movement', id] as const,
  catalog: (kind: CatalogKind) => ['cash', 'catalog', kind] as const,
}

/** Refresca cuando el almacenamiento avisa de un cambio hecho por fuera. */
function useExternalChanges() {
  const { movements } = useCashConfig()
  const queryClient = useQueryClient()
  useEffect(
    () => movements.subscribe?.(() => queryClient.invalidateQueries({ queryKey: cashKeys.all })),
    [movements, queryClient]
  )
}

export function useMovements(period: Period | null) {
  const { movements } = useCashConfig()
  useExternalChanges()
  return useInfiniteQuery({
    queryKey: cashKeys.list(period),
    queryFn: ({ pageParam }) => movements.list(period, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: movements.staleTime ?? Infinity,
  })
}

export function useSummary(period: Period | null) {
  const { movements } = useCashConfig()
  return useQuery({
    queryKey: cashKeys.summary(period),
    queryFn: () => movements.summary(period),
    staleTime: movements.staleTime ?? Infinity,
  })
}

export function useMovement(id: string) {
  const { movements } = useCashConfig()
  return useQuery({
    queryKey: cashKeys.movement(id),
    queryFn: () => movements.get(id),
    staleTime: movements.staleTime ?? Infinity,
    // Se edita a partir de esta lectura: una copia vieja pisaría cambios más nuevos
    refetchOnMount: 'always',
  })
}

export function useCatalog(kind: CatalogKind) {
  const { catalogs } = useCashConfig()
  return useQuery({
    queryKey: cashKeys.catalog(kind),
    queryFn: () => catalogs.list(kind),
    staleTime: catalogs.staleTime ?? Infinity,
  })
}

export function useCreateCatalogItem(kind: CatalogKind) {
  const { catalogs } = useCashConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => catalogs.create(kind, name),
    onSuccess: (item) => {
      // Se agrega al momento para poder dejarla elegida
      queryClient.setQueryData<CatalogItem[]>(cashKeys.catalog(kind), (items = []) =>
        items.some((i) => i.id === item.id) ? items : [...items, item]
      )
      return queryClient.invalidateQueries({ queryKey: cashKeys.catalog(kind) })
    },
  })
}

export function useSaveMovement(id?: string) {
  const { movements } = useCashConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MovementInput) => (id ? movements.update(id, input) : movements.create(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cashKeys.all }),
  })
}

export function useDeleteMovement() {
  const { movements } = useCashConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => movements.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cashKeys.all }),
  })
}
