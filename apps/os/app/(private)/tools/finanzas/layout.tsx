'use client'

// Cómo monta El Negocio OS las entradas y salidas: datos en el API del negocio.
import { CashProvider, type CashConfig } from '@el-negocio/tool-cash'
import { apiCatalogStorage, apiMovementsStorage } from '@/lib/cash-storage'

const config: CashConfig = {
  movements: apiMovementsStorage,
  catalogs: apiCatalogStorage,
  routes: { home: '/tools' },
  copy: {
    backLabel: 'Herramientas',
    description: 'Lo que entra y sale de tu negocio.',
    deleteWarning: 'Se borrará por completo y no podrás recuperarlo.',
    saveError: 'No se pudo guardar. Revisa tu conexión y vuelve a intentar.',
    deleteError: 'No se pudo borrar. Revisa tu conexión y vuelve a intentar.',
  },
}

export default function EntradasSalidasLayout({ children }: { children: React.ReactNode }) {
  return <CashProvider config={config}>{children}</CashProvider>
}
