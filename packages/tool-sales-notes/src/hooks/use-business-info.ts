'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSalesNotesConfig } from '../provider'
import type { BusinessInfo } from '../types'

const businessKey = ['businessInfo'] as const
const EMPTY: BusinessInfo = { name: '', phone: '' }

function useBusinessInfoQuery() {
  const { business } = useSalesNotesConfig()
  return useQuery({
    queryKey: businessKey,
    queryFn: () => business.get(),
    staleTime: business.staleTime ?? Infinity,
  })
}

export function useBusinessInfo() {
  return useBusinessInfoQuery().data ?? EMPTY
}

/** Falso mientras no se conocen los datos del negocio: el documento saldría sin ellos. */
export function useBusinessInfoReady() {
  return useBusinessInfoQuery().data !== undefined
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
