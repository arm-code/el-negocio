// Ficha de la herramienta para catálogos y menús. La ruta la pone cada aplicación.
import { Wallet } from 'lucide-react'

export const cashMeta = {
  id: 'cash',
  title: 'Entradas y salidas',
  /** Para menús angostos, como la barra inferior del celular. */
  shortTitle: 'Caja',
  description: 'Anota lo que entra y lo que sale de tu negocio',
  icon: Wallet,
} as const
