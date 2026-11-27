'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAgendaConfig } from '../provider'
import type { EventInput, EventStatus } from '../types'

export const agendaKeys = {
  all: ['agenda'] as const,
  list: ['agenda', 'list'] as const,
  event: (id: string) => ['agenda', 'event', id] as const,
}

/** Refresca cuando el almacenamiento avisa de un cambio hecho por fuera. */
function useExternalChanges() {
  const { events } = useAgendaConfig()
  const queryClient = useQueryClient()
  useEffect(
    () => events.subscribe?.(() => queryClient.invalidateQueries({ queryKey: agendaKeys.all })),
    [events, queryClient]
  )
}

export function useEvents() {
  const { events } = useAgendaConfig()
  useExternalChanges()
  return useQuery({
    queryKey: agendaKeys.list,
    queryFn: () => events.list(),
    staleTime: events.staleTime ?? Infinity,
  })
}

export function useEvent(id: string) {
  const { events } = useAgendaConfig()
  return useQuery({
    queryKey: agendaKeys.event(id),
    queryFn: () => events.get(id),
    staleTime: events.staleTime ?? Infinity,
    // Se corrige a partir de esta lectura: una copia vieja pisaría cambios más nuevos
    refetchOnMount: 'always',
  })
}

function useRefresh() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: agendaKeys.all })
}

export function useSaveEvent(id?: string) {
  const { events } = useAgendaConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: EventInput) => (id ? events.update(id, input) : events.create(input)),
    onSuccess: refresh,
  })
}

export function useSetStatus() {
  const { events } = useAgendaConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) => events.setStatus(id, status),
    onSuccess: refresh,
  })
}

export function useDeleteEvent() {
  const { events } = useAgendaConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: string) => events.remove(id),
    onSuccess: refresh,
  })
}
