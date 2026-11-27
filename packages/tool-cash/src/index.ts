// API pública de la micro-app de entradas y salidas.
// La aplicación que la usa solo debe importar desde aquí.

export { CashHome } from './components/cash-home'
export { CashProvider } from './provider'
export type { CashConfig, CashRoutes, CashCopy } from './provider'
export type { MovementsStorage, CatalogStorage } from './ports'
export { LIMITS } from './lib/limits'
export type {
  CatalogItem,
  CatalogKind,
  Movement,
  MovementInput,
  MovementKind,
  MovementsPage,
  Period,
  Totals,
} from './types'
