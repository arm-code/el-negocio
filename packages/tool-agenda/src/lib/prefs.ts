// Recuerda qué datos opcionales se usaron la última vez, para mostrarlos abiertos.
// Solo es una comodidad: si se pierde, no pasa nada.

export const BLOCKS = ['time', 'client', 'place', 'charge', 'return', 'guarantee', 'notes'] as const
export type Block = (typeof BLOCKS)[number]

const KEY = 'el-negocio:agenda-prefs:v1'

interface Prefs {
  blocks?: unknown
  methodId?: unknown
}

function read(): Prefs {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return typeof saved === 'object' && saved !== null ? saved : {}
  } catch {
    return {}
  }
}

function save(changes: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...changes }))
  } catch {
    // Sin almacenamiento (modo privado) el formulario funciona igual, sin recordar
  }
}

export function readBlocks(): Block[] {
  const { blocks } = read()
  return Array.isArray(blocks) ? BLOCKS.filter((block) => blocks.includes(block)) : []
}

export const rememberBlocks = (blocks: Block[]) => save({ blocks })

/** Última forma de pago usada al cobrar. */
export function readMethod(): string {
  const { methodId } = read()
  return typeof methodId === 'string' ? methodId : ''
}

export const rememberMethod = (methodId: string) => save({ methodId })
