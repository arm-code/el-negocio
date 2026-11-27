// El PDF se escribe como texto (no como foto): se ve nítido, pesa poco y se reparte en
// las hojas tamaño carta que hagan falta.

import type { jsPDF } from 'jspdf'
import type { Block } from './blocks'

const PAGE = { width: 215.9, height: 279.4, margin: 18 }
const WIDTH = PAGE.width - PAGE.margin * 2
const BOTTOM = PAGE.height - PAGE.margin
const SIZE = 10
const LINE = 4.7
const GAP = 2.4
/** Espacio para firmar, arriba de la raya. */
const SIGN = 13

/** Las fuentes incluidas solo traen el alfabeto latino: se sustituye lo demás. */
export function printable(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/[\t\r]/g, ' ')
    .replace(/[^\n\x20-\x7e\xa0-\xff]/g, '')
}

class Writer {
  y = PAGE.margin

  constructor(
    private pdf: jsPDF,
    /** Hoja aparte donde medir sin dibujar en el documento. */
    private scratch?: jsPDF
  ) {}

  font(bold = false, size = SIZE) {
    this.pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    this.pdf.setFontSize(size)
  }

  newPage() {
    this.pdf.addPage()
    this.y = PAGE.margin
  }

  /** Cambia de hoja si lo que sigue no cabe. */
  need(height: number) {
    if (this.y + height > BOTTOM && this.y > PAGE.margin) this.newPage()
  }

  /**
   * Ancho tal como se dibuja. jsPDF descuenta al medir un ajuste entre letras que no
   * aplica al escribir; letra por letra no lo descuenta y las palabras no se enciman.
   */
  width(text: string): number {
    let total = 0
    for (const char of text) total += this.pdf.getTextWidth(char)
    return total
  }

  /** Parte un texto en renglones que quepan; una palabra más larga se corta. */
  lines(text: string, width = WIDTH): string[] {
    const lines: string[] = []
    for (const paragraph of printable(text).split('\n')) {
      let line = ''
      for (let word of paragraph.split(' ').filter(Boolean)) {
        const joined = line ? `${line} ${word}` : word
        if (this.width(joined) <= width) {
          line = joined
          continue
        }
        if (line) lines.push(line)
        while (this.width(word) > width && word.length > 1) {
          let cut = word.length - 1
          while (cut > 1 && this.width(word.slice(0, cut)) > width) cut--
          lines.push(word.slice(0, cut))
          word = word.slice(cut)
        }
        line = word
      }
      lines.push(line)
    }
    return lines
  }

  paragraph(text: string, align: 'left' | 'right' | 'justify' = 'left', height = LINE) {
    for (const block of printable(text).split('\n')) {
      const lines = this.lines(block)
      lines.forEach((line, index) => {
        this.need(height)
        // La última línea de un párrafo justificado queda suelta
        if (align === 'justify' && index < lines.length - 1) this.justified(line)
        else if (align === 'right') this.pdf.text(line, PAGE.width - PAGE.margin - this.width(line), this.y + 4)
        else this.pdf.text(line, PAGE.margin, this.y + 4)
        this.y += height
      })
    }
    this.y += height < LINE ? GAP / 2 : GAP
  }

  private justified(line: string) {
    const words = line.trim().split(/\s+/)
    if (words.length < 2) {
      this.pdf.text(line, PAGE.margin, this.y + 4)
      return
    }
    const used = words.reduce((sum, word) => sum + this.width(word), 0)
    const space = (WIDTH - used) / (words.length - 1)
    let x = PAGE.margin
    for (const word of words) {
      this.pdf.text(word, x, this.y + 4)
      x += this.width(word) + space
    }
  }

  title(text: string) {
    this.font(true, 14)
    this.need(14)
    for (const line of this.lines(text)) {
      this.pdf.text(line, PAGE.width / 2, this.y + 5, { align: 'center' })
      this.y += 7
    }
    this.y += GAP
  }

  heading(text: string) {
    this.font(true)
    // Que un encabezado no quede solo al final de la hoja
    this.need(LINE * 4)
    this.y += 1
    this.paragraph(text)
  }

  meta(left: string, right: string) {
    this.font(true)
    this.need(LINE)
    this.pdf.text(printable(left), PAGE.margin, this.y + 4)
    this.pdf.text(printable(right), PAGE.width - PAGE.margin, this.y + 4, { align: 'right' })
    this.y += LINE + GAP
  }

  fields(rows: { label: string; value: string }[]) {
    for (const { label, value } of rows) {
      this.font(true)
      const prefix = `${printable(label)}: `
      const indent = this.width(prefix) + 0.3
      this.font(false)
      const lines = this.lines(value, WIDTH - indent)
      this.need(LINE * lines.length + 1)
      this.font(true)
      this.pdf.text(prefix, PAGE.margin, this.y + 4)
      this.font(false)
      for (const line of lines) {
        this.pdf.text(line, PAGE.margin + indent, this.y + 4)
        this.y += LINE
      }
      this.y += 1
    }
    this.y += GAP
  }

  table(block: Extract<Block, { type: 'table' }>) {
    const pad = 1.2
    const leading = 3.9
    const row = (cells: string[], bold = false) => {
      this.font(bold, 9)
      const wrapped = block.columns.map((column, i) => this.lines(cells[i] ?? '', column.width * WIDTH - pad * 2))
      const height = Math.max(...wrapped.map((lines) => lines.length), 1) * leading + pad * 2
      return {
        height,
        draw: () => {
          this.font(bold, 9)
          let x = PAGE.margin
          block.columns.forEach((column, i) => {
            const width = column.width * WIDTH
            this.pdf.rect(x, this.y, width, height)
            wrapped[i].forEach((line, n) => {
              const at = this.y + pad + 3 + n * leading
              this.pdf.text(line, column.right ? x + width - pad - this.width(line) : x + pad, at)
            })
            x += width
          })
          this.y += height
        },
      }
    }

    this.pdf.setLineWidth(0.2)
    const head = () => row(block.columns.map((c) => c.label), true)
    const first = head()
    this.need(first.height * 2)
    first.draw()
    for (const cells of block.rows) {
      const next = row(cells)
      if (this.y + next.height > BOTTOM) {
        this.newPage()
        head().draw()
      }
      next.draw()
    }
    if (block.total) {
      this.font(true, 9.5)
      const lines = this.lines(`${block.total.label}: ${block.total.value}`)
      const height = lines.length * 4.6 + pad * 2
      this.need(height)
      this.pdf.rect(PAGE.margin, this.y, WIDTH, height)
      lines.forEach((line, n) =>
        this.pdf.text(line, PAGE.width - PAGE.margin - pad, this.y + pad + 3.4 + n * 4.6, { align: 'right' })
      )
      this.y += height
    }
    this.y += GAP * 2
  }

  signatures(people: { role: string; name: string }[]) {
    const columns = Math.min(people.length, 2)
    const width = WIDTH / columns
    const line = Math.min(width - 10, 75)
    for (let i = 0; i < people.length; i += columns) {
      this.font(false, 9.5)
      const group = people.slice(i, i + columns)
      const texts = group.map((p) => [...this.lines(p.role, line), ...this.lines(p.name, line)])
      const height = SIGN + 2 + Math.max(...texts.map((t) => t.length)) * 4.4 + GAP
      this.need(height)
      group.forEach((person, n) => {
        const center = PAGE.margin + width * n + width / 2
        this.pdf.setLineWidth(0.3)
        this.pdf.line(center - line / 2, this.y + SIGN, center + line / 2, this.y + SIGN)
        const roleLines = this.lines(person.role, line).length
        texts[n].forEach((text, k) => {
          this.font(k < roleLines, 9.5)
          this.pdf.text(text, center, this.y + SIGN + 4.2 + k * 4.4, { align: 'center' })
        })
      })
      this.y += height
    }
    this.y += GAP
  }

  group(blocks: Block[]) {
    if (this.scratch) {
      const probe = new Writer(this.scratch)
      for (const block of blocks) probe.render(block)
      this.need(probe.y - PAGE.margin)
    }
    for (const block of blocks) this.render(block)
  }

  render(block: Block): void {
    switch (block.type) {
      case 'title':
        return this.title(block.text)
      case 'heading':
        return this.heading(block.text)
      case 'meta':
        return this.meta(block.left, block.right)
      case 'text':
        this.font(false, block.small ? 9 : SIZE)
        return this.paragraph(block.text, block.align, block.small ? 4 : LINE)
      case 'fields':
        return this.fields(block.rows)
      case 'table':
        return this.table(block)
      case 'signatures':
        return this.signatures(block.people)
      case 'pageBreak':
        return this.newPage()
      case 'group':
        return this.group(block.blocks)
    }
  }
}

/** Carga jsPDF solo cuando se necesita. */
export async function toPdf(blocks: Block[], folio: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const options = { unit: 'mm', format: 'letter', compress: true } as const
  const pdf = new jsPDF(options)
  const writer = new Writer(pdf, new jsPDF(options))
  for (const block of blocks) writer.render(block)

  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(`Folio ${folio} - Hoja ${page} de ${pages}`, PAGE.width / 2, PAGE.height - 10, { align: 'center' })
  }
  return pdf.output('blob')
}
