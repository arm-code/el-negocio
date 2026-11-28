'use client'

// Cómo monta El Negocio OS la agenda: datos en el API del negocio.
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AgendaProvider, type AgendaConfig } from '@el-negocio/tool-agenda'
import { OsDocumentsProvider } from '@/components/documents/os-documents-provider'
import { apiEventsStorage, apiPaymentsStorage } from '@/lib/agenda-storage'

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const config = useMemo<AgendaConfig>(
    () => ({
      events: apiEventsStorage,
      payments: {
        ...apiPaymentsStorage,
        async record(event, payment) {
          await apiPaymentsStorage.record(event, payment)
          // El cobro es una entrada de dinero: la Caja y el inicio deben verla
          await queryClient.invalidateQueries({ queryKey: ['cash'] })
        },
      },
      routes: { home: '/tools', cash: '/tools/finanzas' },
      copy: {
        backLabel: 'Herramientas',
        description: 'Las citas, pedidos y entregas de tu negocio.',
        deleteWarning: 'Dejará de aparecer en tu agenda. Lo ya cobrado se queda en tu caja.',
        saveError: 'No se pudo guardar. Revisa tu conexión y vuelve a intentar.',
        deleteError: 'No se pudo borrar. Revisa tu conexión y vuelve a intentar.',
      },
    }),
    [queryClient]
  )

  // La agenda enseña los documentos de cada cosa agendada
  return (
    <OsDocumentsProvider>
      <AgendaProvider config={config}>{children}</AgendaProvider>
    </OsDocumentsProvider>
  )
}
