// API pública de la micro-app de agenda.
// La aplicación que la usa solo debe importar desde aquí.

export { AgendaHome } from './components/agenda-home'
export { AgendaProvider } from './provider'
export type { AgendaConfig, AgendaRoutes, AgendaCopy } from './provider'
export type { EventsStorage } from './ports'
export { LIMITS } from './lib/limits'
export type { AgendaEvent, EventInput, EventStatus } from './types'
