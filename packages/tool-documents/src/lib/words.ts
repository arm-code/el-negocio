// Cantidades con letra, como se escriben en un pagaré.

const UNITS = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
]
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
  'ochocientos', 'novecientos',
]

function belowThousand(n: number): string {
  if (n === 100) return 'cien'
  const rest = n % 100
  const parts = [HUNDREDS[Math.floor(n / 100)]]
  if (rest > 0 && rest < 30) parts.push(UNITS[rest])
  else if (rest >= 30) parts.push(TENS[Math.floor(rest / 10)] + (rest % 10 ? ` y ${UNITS[rest % 10]}` : ''))
  return parts.filter(Boolean).join(' ')
}

/** Antes de "mil", "millones" o "pesos": "veintiún mil", "un millón". */
const shorten = (words: string) => words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')

/** Entero entre 0 y 999 999 999. */
export function numberToWords(n: number): string {
  if (n === 0) return UNITS[0]
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (millions) parts.push(millions === 1 ? 'un millón' : `${shorten(belowThousand(millions))} millones`)
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${shorten(belowThousand(thousands))} mil`)
  if (rest) parts.push(belowThousand(rest))
  return parts.join(' ')
}

/** 1500.5 → "MIL QUINIENTOS PESOS 50/100 MONEDA NACIONAL" */
export function moneyInWords(amount: number): string {
  const cents = Math.round(amount * 100)
  const pesos = Math.floor(cents / 100)
  const words = shorten(numberToWords(pesos))
  // "un millón de pesos", pero "un millón quinientos pesos"
  const of = pesos >= 1_000_000 && pesos % 1_000_000 === 0 ? ' de' : ''
  const currency = pesos === 1 ? 'peso' : 'pesos'
  return `${words}${of} ${currency} ${String(cents % 100).padStart(2, '0')}/100 moneda nacional`.toUpperCase()
}

/** "3.5" → "tres punto cinco por ciento" */
export function percentInWords(percent: number): string {
  const [whole, decimals] = String(Math.round(percent * 100) / 100).split('.')
  let words = numberToWords(Number(whole))
  if (decimals) {
    // Un cero a la izquierda se lee: "punto cero cinco"
    const zeros = decimals.startsWith('0') ? 'cero ' : ''
    words += ` punto ${zeros}${numberToWords(Number(decimals))}`
  }
  return `${words} por ciento`
}
