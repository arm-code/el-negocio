// Recuerda qué datos opcionales se usaron la última vez, para mostrarlos abiertos.
// Solo es una comodidad: si se pierde, no pasa nada.

export const BLOCKS = ['time', 'client', 'place', 'notes'] as const
export type Block = (typeof BLOCKS)[number]

const KEY = 'el-negocio:agenda-prefs:v1'

export function readBlocks(): Block[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const blocks = (saved as { blocks?: unknown }).blocks
    return Array.isArray(blocks) ? BLOCKS.filter((block) => blocks.includes(block)) : []
  } catch {
    return []
  }
}

export function rememberBlocks(blocks: Block[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ blocks }))
  } catch {
    // Sin almacenamiento (modo privado) el formulario funciona igual, sin recordar
  }
}
