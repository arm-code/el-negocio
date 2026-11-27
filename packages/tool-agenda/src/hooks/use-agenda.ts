'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAgendaConfig } from '../provider'
import type { AgendaEvent, EventInput, EventStatus, PaymentInput } from '../types'

export const agendaKeys = {
  all: ['agenda'] as const,
  list: ['agenda', 'list'] as const,
  event: (id: string) => ['agenda', 'event', id] as const,
  payments: (id: string) => ['agenda', 'payments', id] as const,
  methods: ['agenda', 'methods'] as const,
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

export function usePaymentMethods(enabled = true) {
  const { payments, events } = useAgendaConfig()
  return useQuery({
    queryKey: agendaKeys.methods,
    queryFn: () => payments.methods(),
    staleTime: events.staleTime ?? Infinity,
    enabled,
  })
}

export function usePayments(eventId: string) {
  const { payments } = useAgendaConfig()
  return useQuery({
    queryKey: agendaKeys.payments(eventId),
    queryFn: () => payments.list(eventId),
    // Un cobro puede corregirse o borrarse desde Caja
    refetchOnMount: 'always',
  })
}

export function useRecordPayment() {
  const { payments } = useAgendaConfig()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ event, payment }: { event: AgendaEvent; payment: PaymentInput }) => payments.record(event, payment),
    onSuccess: refresh,
  })
}
