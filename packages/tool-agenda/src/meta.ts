// Ficha de la herramienta para catálogos y menús. La ruta la pone cada aplicación.
import { CalendarDays } from 'lucide-react'

export const agendaMeta = {
  id: 'agenda',
  title: 'Agenda',
  /** Para menús angostos, como la barra inferior del celular. */
  shortTitle: 'Agenda',
  description: 'Anota citas, pedidos y entregas para que no se te pasen',
  icon: CalendarDays,
} as const
