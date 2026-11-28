/** Límites de captura. Son iguales o más estrictos que los del API. */
export const LIMITS = {
  title: 150,
  clientName: 150,
  clientPhone: 30,
  place: 255,
  notes: 1000,
  guarantee: 150,
  /** Igual que en entradas y salidas, donde terminan los cobros. */
  maxAmount: 10_000_000,
} as const
