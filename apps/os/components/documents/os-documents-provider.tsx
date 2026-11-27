'use client'

// Cómo monta El Negocio OS los contratos y pagarés: datos en el API del negocio.
import { DocumentsProvider, type DocumentsConfig } from '@el-negocio/tool-documents'
import { apiDocumentsStorage, businessDefaults } from '@/lib/documents-storage'

const config: DocumentsConfig = {
  documents: apiDocumentsStorage,
  defaults: businessDefaults,
  routes: { home: '/tools' },
  copy: {
    backLabel: 'Herramientas',
    description: 'Los documentos de tu negocio.',
    deleteWarning: 'Dejará de aparecer en tu lista. Su folio no se vuelve a usar.',
    saveError: 'No se pudo guardar. Revisa tu conexión y vuelve a intentar.',
    deleteError: 'No se pudo borrar. Revisa tu conexión y vuelve a intentar.',
  },
}

export function OsDocumentsProvider({ children }: { children: React.ReactNode }) {
  return <DocumentsProvider config={config}>{children}</DocumentsProvider>
}
