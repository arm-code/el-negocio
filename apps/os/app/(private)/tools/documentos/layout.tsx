import { OsDocumentsProvider } from '@/components/documents/os-documents-provider'

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  return <OsDocumentsProvider>{children}</OsDocumentsProvider>
}
