'use client'

// Cómo monta El Negocio OS las notas de venta: datos en el API del negocio.
import { SalesNotesProvider, type SalesNotesConfig } from '@el-negocio/tool-sales-notes'
import { apiBusinessInfoStorage, apiNotesStorage } from '@/lib/sales-notes-storage'

const BASE = '/tools/notas-venta'

const config: SalesNotesConfig = {
  notes: apiNotesStorage,
  business: apiBusinessInfoStorage,
  routes: {
    home: '/tools',
    list: BASE,
    create: `${BASE}/crear-nota-venta`,
    edit: (id) => `${BASE}/editar-nota-venta/${encodeURIComponent(id)}`,
  },
  copy: {
    backLabel: 'Herramientas',
    listDescription: 'Busca, comparte o administra tus notas y cotizaciones.',
    deleteWarning: 'Se borrará por completo y no podrás recuperarla.',
    saveError: 'No se pudo guardar la nota. Revisa tu conexión y vuelve a intentar.',
    deleteError: 'No se pudo eliminar. Revisa tu conexión y vuelve a intentar.',
    notFoundHint: 'Puede que ya se haya eliminado.',
  },
}

export default function NotasVentaLayout({ children }: { children: React.ReactNode }) {
  return <SalesNotesProvider config={config}>{children}</SalesNotesProvider>
}
