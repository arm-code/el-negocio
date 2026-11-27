// Ficha de la herramienta para catálogos y menús. La ruta la pone cada aplicación.
import { Receipt } from 'lucide-react'

export const salesNotesMeta = {
  id: 'sales-note',
  title: 'Notas de venta',
  /** Para menús angostos, como la barra inferior del celular. */
  shortTitle: 'Notas',
  description: 'Hazle su nota al cliente y mándala por WhatsApp',
  icon: Receipt,
} as const
