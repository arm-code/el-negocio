'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSalesNotesConfig } from '../provider'
import type { NoteInput } from '../types'

export const notesKeys = {
  all: ['salesNotes'] as const,
  detail: (id: string) => ['salesNotes', id] as const,
}

/** Refresca la lista cuando el almacenamiento avisa de un cambio hecho por fuera. */
function useExternalChanges() {
  const { notes } = useSalesNotesConfig()
  const queryClient = useQueryClient()
  useEffect(
    () => notes.subscribe?.(() => queryClient.invalidateQueries({ queryKey: notesKeys.all })),
    [notes, queryClient]
  )
}

export function useSalesNotes() {
  const { notes } = useSalesNotesConfig()
  useExternalChanges()
  return useQuery({
    queryKey: notesKeys.all,
    queryFn: () => notes.list(),
    staleTime: notes.staleTime ?? Infinity,
  })
}

export function useSalesNote(id: string | undefined) {
  const { notes } = useSalesNotesConfig()
  return useQuery({
    queryKey: notesKeys.detail(id ?? ''),
    queryFn: () => notes.get(id!),
    enabled: Boolean(id),
    staleTime: notes.staleTime ?? Infinity,
    // Se edita a partir de esta lectura: una copia vieja pisaría cambios más nuevos
    refetchOnMount: 'always',
  })
}

export function useSaveSalesNote(id?: string) {
  const { notes } = useSalesNotesConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoteInput) => (id ? notes.update(id, input) : notes.create(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKeys.all }),
  })
}

export function useDeleteSalesNote() {
  const { notes } = useSalesNotesConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => notes.remove(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKeys.all }),
  })
}
