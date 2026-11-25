'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSalesNotesConfig } from '../provider'
import type { BusinessInfo } from '../types'

const businessKey = ['businessInfo'] as const
const EMPTY: BusinessInfo = { name: '', phone: '' }

export function useBusinessInfo() {
  const { business } = useSalesNotesConfig()
  const { data } = useQuery({
    queryKey: businessKey,
    queryFn: () => business.get(),
    staleTime: Infinity,
  })
  return data ?? EMPTY
}

export function useSaveBusinessInfo() {
  const { business } = useSalesNotesConfig()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (info: BusinessInfo) => {
      if (!business.save) throw new Error('Los datos del negocio son de solo lectura.')
      return business.save(info)
    },
    onSuccess: (info) => queryClient.setQueryData(businessKey, info),
  })
}
