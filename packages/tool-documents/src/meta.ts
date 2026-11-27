// Ficha de la herramienta para catálogos y menús. La ruta la pone cada aplicación.
import { FileSignature } from 'lucide-react'

export const documentsMeta = {
  id: 'documents',
  title: 'Contratos y pagarés',
  /** Para menús angostos, como la barra inferior del celular. */
  shortTitle: 'Contratos',
  description: 'Llena los datos y sal con el documento listo para firmar',
  icon: FileSignature,
} as const
