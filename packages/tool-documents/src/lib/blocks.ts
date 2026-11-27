// Un documento como una lista de bloques: la pantalla y el PDF dibujan lo mismo.

export interface Column {
  label: string
  /** Parte del ancho, de 0 a 1. */
  width: number
  right?: boolean
}

export type Block =
  | { type: 'title'; text: string }
  | { type: 'heading'; text: string }
  /** Dos datos en la misma línea, uno a cada lado. */
  | { type: 'meta'; left: string; right: string }
  /** `small`: letra chica, para condiciones de un anexo. */
  | { type: 'text'; text: string; align?: 'left' | 'right' | 'justify'; small?: boolean }
  | { type: 'fields'; rows: { label: string; value: string }[] }
  | { type: 'table'; columns: Column[]; rows: string[][]; total?: { label: string; value: string } }
  | { type: 'signatures'; people: { role: string; name: string }[] }
  | { type: 'pageBreak' }
  /** Bloques que no conviene separar en dos hojas, p. ej. unos datos y su firma. */
  | { type: 'group'; blocks: Block[] }
