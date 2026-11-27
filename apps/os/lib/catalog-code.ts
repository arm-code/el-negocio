import { toSlug } from '@/lib/display'

/** El código lo genera el sistema a partir del nombre: "Renta de sillas" → "RENTA_DE_SILLAS". */
export function codeFromName(name: string): string {
  return toSlug(name, 'item').toUpperCase().replace(/-/g, '_').slice(0, 20)
}
