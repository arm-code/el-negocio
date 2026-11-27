// Los formatos disponibles: qué se pregunta y qué dice cada documento.
//
// El pagaré con relación de mobiliario sigue el machote que usa el negocio. Los demás
// son formatos sencillos de apoyo: conviene que un abogado los revise.

import type { BusinessDocument, DocumentItem, DocumentKind, DocumentValues, FieldKey } from '../types'
import type { Block, Column } from './blocks'
import { BLANK, dateText, folioText, itemsTotal, lineValue, moneyText } from './format'
import { moneyInWords, percentInWords } from './words'

export interface TemplateField {
  key: FieldKey
  label?: string
  required?: boolean
  placeholder?: string
}

export interface TemplateSection {
  title: string
  fields: TemplateField[]
  /** Datos propios: se recogen cuando ya vienen llenos. */
  own?: boolean
  /** Se pueden dejar en blanco: aparecen recogidos. */
  optional?: boolean
}

export interface ItemsInfo {
  title: string
  /** Etiqueta del valor de cada artículo. */
  valueLabel: string
  required: boolean
  /** La cantidad del documento es la suma de los artículos. */
  totalIsAmount: boolean
}

export interface Template {
  kind: DocumentKind
  name: string
  hint: string
  sections: TemplateSection[]
  items?: ItemsInfo
  defaults?: DocumentValues
  build(doc: BusinessDocument): Block[]
}

/** Lo capturado, listo para escribirse: lo vacío queda como espacio en blanco. */
function reader({ values }: BusinessDocument) {
  const text = (key: FieldKey) => values[key]?.trim() || BLANK
  const has = (key: FieldKey) => Boolean(values[key]?.trim())
  const money = (key: FieldKey) => Number(values[key] ?? 0) || 0
  const date = (key: FieldKey) => dateText(values[key])
  const court = values.jurisdiction?.trim() || values.city?.trim() || BLANK
  return { text, has, money, date, court }
}

const amountPhrase = (amount: number) =>
  amount > 0 ? `${moneyText(amount)} (${moneyInWords(amount)})` : `$${BLANK}`

const own = (...extra: TemplateField[]): TemplateSection => ({
  title: 'Tus datos',
  own: true,
  fields: [
    { key: 'ownerName', required: true },
    { key: 'ownerAddress' },
    ...extra,
    { key: 'city', required: true },
    { key: 'jurisdiction' },
  ],
})

const client = (title: string): TemplateSection => ({
  title,
  fields: [{ key: 'clientName', required: true }, { key: 'clientAddress' }, { key: 'clientPhone' }, { key: 'clientId' }],
})

const guarantor: TemplateSection = {
  title: 'Aval (opcional, recomendado)',
  optional: true,
  fields: [{ key: 'guarantorName' }, { key: 'guarantorAddress' }],
}

function itemsTable(items: DocumentItem[], valueLabel: string, total?: string): Block {
  const withValues = items.some((item) => item.unitValue > 0) || Boolean(total)
  const columns: Column[] = withValues
    ? [
        { label: 'No.', width: 0.07 },
        { label: 'Cant.', width: 0.09 },
        { label: 'Descripción del artículo', width: 0.48 },
        { label: valueLabel, width: 0.2, right: true },
        { label: 'Importe', width: 0.16, right: true },
      ]
    : [
        { label: 'No.', width: 0.08 },
        { label: 'Cant.', width: 0.12 },
        { label: 'Descripción del artículo', width: 0.8 },
      ]
  const rows = items.map((item, index) => {
    const base = [String(index + 1), String(item.quantity), item.description]
    if (!withValues) return base
    const priced = item.unitValue > 0
    return [...base, priced ? moneyText(item.unitValue) : '', priced ? moneyText(lineValue(item)) : '']
  })
  return {
    type: 'table',
    columns,
    rows,
    total: total ? { label: total, value: moneyText(itemsTotal(items)) } : undefined,
  }
}

// ─── Pagarés ────────────────────────────────────────────────────────────────

function promissory(doc: BusinessDocument, amount: number, guaranteeClause?: string): Block[] {
  const { text, has, money, date, court } = reader(doc)
  const due = has('dueDate') ? `el día ${date('dueDate')}` : 'el día de su presentación para cobro (a la vista)'
  const interest = money('interest')

  const blocks: Block[] = [
    { type: 'title', text: 'PAGARÉ' },
    {
      type: 'meta',
      left: `Folio No. ${folioText(doc.folio)}`,
      right: `Bueno por: ${amount > 0 ? moneyText(amount) : `$${BLANK}`} M.N.`,
    },
    { type: 'text', text: `En ${text('city')}, a ${date('date')}.`, align: 'right' },
    {
      type: 'text',
      align: 'justify',
      text: `Debo y pagaré incondicionalmente por este PAGARÉ a la orden de ${text('ownerName')}, en su domicilio ubicado en ${text('ownerAddress')}, o en el lugar que éste designe, ${due}, la cantidad de ${amountPhrase(amount)}.`,
    },
  ]
  if (guaranteeClause) blocks.push({ type: 'text', align: 'justify', text: guaranteeClause })
  if (interest > 0) {
    blocks.push({
      type: 'text',
      align: 'justify',
      text: `La suma que este pagaré expresa causará intereses moratorios a razón de ${interest}% (${percentInWords(interest)}) mensual, desde el día de su vencimiento y hasta su total liquidación, pagaderos junto con el principal. Los gastos y costas que se originen por su cobro, judicial o extrajudicial, serán a cargo del suscriptor.`,
    })
  }
  blocks.push(
    {
      type: 'text',
      align: 'justify',
      text: `Para la interpretación y cumplimiento de este pagaré, el suscriptor se somete expresamente a la jurisdicción y competencia de los tribunales de ${court}, renunciando al fuero que pudiera corresponderle por razón de su domicilio presente o futuro o por cualquier otra causa.`,
    },
    {
      type: 'text',
      align: 'justify',
      text: 'Este documento es un pagaré mercantil regulado por los artículos 170 y relativos de la Ley General de Títulos y Operaciones de Crédito.',
    },
    {
      type: 'group',
      blocks: [
        { type: 'heading', text: 'DATOS DEL SUSCRIPTOR (DEUDOR)' },
        {
          type: 'fields',
          rows: [
            { label: 'Nombre completo', value: text('clientName') },
            { label: 'Domicilio', value: text('clientAddress') },
            { label: 'Teléfono', value: text('clientPhone') },
            { label: 'Identificación oficial', value: text('clientId') },
          ],
        },
        { type: 'signatures', people: [{ role: 'SUSCRIPTOR', name: text('clientName') }] },
      ],
    }
  )
  if (has('guarantorName')) {
    blocks.push({
      type: 'group',
      blocks: [
        { type: 'heading', text: 'AVAL' },
        {
          type: 'text',
          align: 'justify',
          text: 'Por aval, me obligo solidariamente con el suscriptor al pago total de este pagaré, en los términos de los artículos 109 y siguientes de la Ley General de Títulos y Operaciones de Crédito.',
        },
        {
          type: 'fields',
          rows: [
            { label: 'Nombre completo', value: text('guarantorName') },
            { label: 'Domicilio', value: text('guarantorAddress') },
          ],
        },
        { type: 'signatures', people: [{ role: 'AVAL', name: text('guarantorName') }] },
      ],
    })
  }
  return blocks
}

const promissoryTemplate: Template = {
  kind: 'promissory',
  name: 'Pagaré',
  hint: 'Alguien te debe y firma que te va a pagar',
  sections: [
    {
      title: 'La deuda',
      fields: [
        { key: 'amount', label: '¿Cuánto te van a pagar? ($)', required: true },
        { key: 'dueDate', label: 'Fecha de pago (vacía: cuando lo cobres)' },
        { key: 'date', required: true },
        { key: 'interest' },
      ],
    },
    client('Quien debe'),
    guarantor,
    own(),
  ],
  build: (doc) => promissory(doc, Number(doc.values.amount ?? 0) || 0),
}

const promissoryRentalTemplate: Template = {
  kind: 'promissory-rental',
  name: 'Pagaré con relación de mobiliario',
  hint: 'Rentas algo y firman por su valor, con la lista de lo que se llevan',
  items: { title: 'Mobiliario que se llevan', valueLabel: 'Valor de reposición', required: true, totalIsAmount: true },
  sections: [
    client('Cliente'),
    {
      title: 'La renta',
      fields: [
        { key: 'serviceDate', label: 'Fecha del evento', required: true },
        { key: 'place', label: 'Dirección del evento o de entrega' },
        { key: 'deliveryDate' },
        { key: 'returnDate', label: 'Fecha de recolección' },
        { key: 'date', required: true },
      ],
    },
    {
      title: 'Condiciones',
      optional: true,
      fields: [{ key: 'interest' }, { key: 'lateFee' }, { key: 'claimDays' }, { key: 'observations' }],
    },
    guarantor,
    own(),
  ],
  build(doc) {
    const { text, has, date } = reader(doc)
    const total = itemsTotal(doc.items)
    const clause = `Este pagaré se suscribe en garantía de la devolución, en el mismo estado en que se recibió, del mobiliario y equipo descrito en la Relación de Mobiliario anexa con el mismo folio, recibido en renta para el evento a celebrarse el ${date('serviceDate')}, quedando el suscriptor obligado al pago de su valor de reposición en caso de daño, pérdida, robo o falta de devolución.`
    const days = has('claimDays') ? text('claimDays') : '____'
    return [
      ...promissory(doc, total, clause),
      { type: 'pageBreak' },
      { type: 'title', text: 'RELACIÓN DE MOBILIARIO EN RENTA' },
      { type: 'text', text: `Anexo al Pagaré Folio No. ${folioText(doc.folio)}` },
      {
        type: 'fields',
        rows: [
          { label: 'Arrendatario (cliente)', value: text('clientName') },
          { label: 'Evento / lugar de entrega', value: text('place') },
          { label: 'Fecha de entrega', value: date('deliveryDate') },
          { label: 'Fecha de recolección', value: date('returnDate') },
        ],
      },
      itemsTable(doc.items, 'Valor unitario de reposición', 'VALOR TOTAL DE REPOSICIÓN (monto del pagaré)'),
      { type: 'heading', text: 'CONDICIONES DE LA RENTA' },
      ...[
        'El cliente recibe el mobiliario descrito en buen estado y se obliga a conservarlo, usarlo con cuidado y devolverlo en la fecha y lugar pactados.',
        'El cliente es responsable de todo daño, mancha permanente, rotura, pérdida, robo o extravío del mobiliario desde su entrega y hasta que sea recibido por el arrendador, incluso por actos de terceros o invitados.',
        'En caso de daño irreparable, pérdida o robo, el cliente pagará el valor unitario de reposición indicado en este anexo. En caso de daño reparable, pagará el costo de la reparación y, en su caso, de la limpieza especial que se requiera.',
        `Si el mobiliario no se devuelve en la fecha pactada, el cliente pagará por cada día de retraso el equivalente a ${text('lateFee')}.`,
        `El arrendador podrá presentar el pagaré para su cobro por los montos adeudados conforme a estas condiciones si el cliente no cubre los daños o faltantes dentro de los ${days} días siguientes a la recolección.`,
      ].map((paragraph): Block => ({ type: 'text', align: 'justify', text: paragraph, small: true })),
      {
        type: 'group',
        blocks: [
          {
            type: 'text',
            align: 'justify',
            small: true,
            text: 'Revisión: el cliente declara haber revisado el mobiliario al recibirlo y estar conforme con su cantidad y estado. Cualquier observación debe anotarse a continuación:',
          },
          {
            type: 'text',
            small: true,
            text: `Observaciones: ${has('observations') ? text('observations') : '__________________________________________'}`,
          },
          {
            type: 'signatures',
            people: [
              { role: 'ARRENDADOR (entrega)', name: text('ownerName') },
              { role: 'CLIENTE (recibe de conformidad)', name: text('clientName') },
            ],
          },
        ],
      },
    ]
  },
}

// ─── Contratos ──────────────────────────────────────────────────────────────

interface Contract {
  title: string
  /** Cómo se llama cada parte, en mayúsculas. */
  parts: [string, string]
  clauses: (string | undefined)[]
  annex?: Block[]
}

const ORDINALS = ['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA', 'SÉPTIMA', 'OCTAVA', 'NOVENA']

function contract(doc: BusinessDocument, { title, parts: [first, second], clauses, annex = [] }: Contract): Block[] {
  const { text, date, has, court } = reader(doc)
  const identified = has('clientId') ? `, quien se identifica con ${text('clientId')}` : ''
  return [
    { type: 'title', text: title },
    { type: 'meta', left: `Folio No. ${folioText(doc.folio)}`, right: `${text('city')}, a ${date('date')}` },
    {
      type: 'text',
      align: 'justify',
      text: `Contrato que celebran, por una parte, ${text('ownerName')}, con domicilio en ${text('ownerAddress')}, en lo sucesivo "${first}"; y por la otra, ${text('clientName')}, con domicilio en ${text('clientAddress')}${identified}, en lo sucesivo "${second}", al tenor de las siguientes cláusulas:`,
    },
    { type: 'heading', text: 'CLÁUSULAS' },
    ...[
      ...clauses,
      `Jurisdicción. Para la interpretación y cumplimiento de este contrato, las partes se someten a las leyes y tribunales competentes de ${court}.`,
    ]
      .filter((clause): clause is string => Boolean(clause))
      .map((clause, index): Block => ({ type: 'text', align: 'justify', text: `${ORDINALS[index]}. ${clause}` })),
    ...(has('observations')
      ? [{ type: 'text', align: 'justify', text: `Observaciones: ${text('observations')}` } satisfies Block]
      : []),
    {
      type: 'group',
      blocks: [
        { type: 'text', text: 'Leído el presente contrato, las partes lo firman de conformidad.' },
        {
          type: 'signatures',
          people: [
            { role: first, name: text('ownerName') },
            { role: second, name: text('clientName') },
          ],
        },
      ],
    },
    ...annex,
  ]
}

/** "Anticipo: … El resto…" */
function paymentClause(doc: BusinessDocument, concept: string) {
  const { money, has, text } = reader(doc)
  const amount = money('amount')
  const advance = money('advance')
  const rest = Math.max(0, Math.round(amount * 100) - Math.round(advance * 100)) / 100
  const base = `Precio. ${concept} es de ${amountPhrase(amount)}`
  const terms = has('paymentTerms') ? ` Forma de pago: ${text('paymentTerms')}.` : ''
  if (advance > 0) {
    return `${base}, de los cuales se entrega como anticipo ${amountPhrase(advance)} a la firma de este contrato, quedando un saldo de ${amountPhrase(rest)}.${terms}`
  }
  return `${base}.${terms || ' Se pagará en una sola exhibición a la firma de este contrato.'}`
}

const saleTemplate: Template = {
  kind: 'sale',
  name: 'Contrato de compraventa',
  hint: 'Vendes algo y quieren dejarlo por escrito',
  sections: [
    {
      title: 'La venta',
      fields: [
        { key: 'description', label: '¿Qué vendes?', required: true, placeholder: 'Marca, modelo, serie, estado' },
        { key: 'amount', label: 'Precio ($)', required: true },
        { key: 'advance' },
        { key: 'paymentTerms' },
        { key: 'date', required: true },
      ],
    },
    client('Comprador'),
    {
      title: 'Entrega y garantía',
      optional: true,
      fields: [{ key: 'deliveryDate' }, { key: 'place', label: 'Lugar de entrega' }, { key: 'warranty' }, { key: 'observations' }],
    },
    own(),
  ],
  build(doc) {
    const { text, has, date } = reader(doc)
    return contract(doc, {
      title: 'CONTRATO DE COMPRAVENTA',
      parts: ['EL VENDEDOR', 'EL COMPRADOR'],
      clauses: [
        `Objeto. EL VENDEDOR vende y EL COMPRADOR adquiere lo siguiente: ${text('description')}.`,
        paymentClause(doc, 'El precio de la venta'),
        `Entrega. Se entregará ${has('deliveryDate') ? `el ${date('deliveryDate')}` : 'a la firma de este contrato'}${has('place') ? ` en ${text('place')}` : ''}.`,
        `Estado. EL VENDEDOR declara que lo vendido es de su propiedad y está libre de adeudos y gravámenes. EL COMPRADOR declara haberlo revisado y estar conforme.${has('warranty') ? ` EL VENDEDOR otorga la siguiente garantía: ${text('warranty')}.` : ''}`,
        'Propiedad. La propiedad se transmite a EL COMPRADOR una vez cubierto el precio total.',
      ],
    })
  },
}

const serviceTemplate: Template = {
  kind: 'service',
  name: 'Contrato de servicio',
  hint: 'Haces un trabajo o atiendes un evento',
  defaults: {
    cancellation:
      'Si el cliente cancela, el anticipo no se devuelve, salvo acuerdo distinto. Si quien presta el servicio cancela, devolverá el anticipo completo.',
  },
  sections: [
    {
      title: 'El servicio',
      fields: [
        { key: 'description', label: '¿Qué vas a hacer?', required: true },
        { key: 'serviceDate' },
        { key: 'place' },
        { key: 'amount', label: 'Precio ($)', required: true },
        { key: 'advance' },
        { key: 'paymentTerms', placeholder: 'Ej. El resto al terminar' },
        { key: 'date', required: true },
      ],
    },
    client('Cliente'),
    { title: 'Condiciones', optional: true, fields: [{ key: 'cancellation' }, { key: 'observations' }] },
    own(),
  ],
  build(doc) {
    const { text, has, date } = reader(doc)
    return contract(doc, {
      title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS',
      parts: ['EL PRESTADOR', 'EL CLIENTE'],
      clauses: [
        `Objeto. EL PRESTADOR se obliga a realizar el siguiente servicio: ${text('description')}.`,
        has('serviceDate') || has('place')
          ? `Fecha y lugar. El servicio se prestará${has('serviceDate') ? ` el ${date('serviceDate')}` : ''}${has('place') ? ` en ${text('place')}` : ''}.`
          : undefined,
        paymentClause(doc, 'El precio del servicio'),
        'Obligaciones. EL PRESTADOR realizará el servicio con el cuidado debido y en los términos acordados. EL CLIENTE dará las facilidades y la información necesarias para realizarlo.',
        has('cancellation') ? `Cancelación. ${text('cancellation')}` : undefined,
      ],
    })
  },
}

const rentalTemplate: Template = {
  kind: 'rental',
  name: 'Contrato de renta',
  hint: 'Rentas mobiliario, equipo o herramienta',
  items: { title: 'Lo que rentas', valueLabel: 'Valor de reposición', required: true, totalIsAmount: false },
  sections: [
    {
      title: 'La renta',
      fields: [
        { key: 'amount', label: 'Precio de la renta ($)', required: true },
        { key: 'advance' },
        { key: 'deliveryDate', required: true },
        { key: 'returnDate', required: true },
        { key: 'place', label: 'Lugar de entrega' },
        { key: 'date', required: true },
      ],
    },
    client('Cliente'),
    {
      title: 'Condiciones',
      optional: true,
      fields: [{ key: 'guarantee' }, { key: 'lateFee' }, { key: 'paymentTerms' }, { key: 'observations' }],
    },
    own(),
  ],
  build(doc) {
    const { text, has, date } = reader(doc)
    return contract(doc, {
      title: 'CONTRATO DE RENTA',
      parts: ['EL ARRENDADOR', 'EL ARRENDATARIO'],
      clauses: [
        'Objeto. EL ARRENDADOR da en renta a EL ARRENDATARIO los artículos descritos en la relación anexa con el mismo folio, en buen estado.',
        `Plazo. Se entregan el ${date('deliveryDate')}${has('place') ? ` en ${text('place')}` : ''} y deben devolverse el ${date('returnDate')}.`,
        paymentClause(doc, 'El precio de la renta'),
        'Cuidado y daños. EL ARRENDATARIO usará los artículos con cuidado y responde de todo daño, pérdida o robo desde su entrega hasta su devolución, incluso por actos de terceros o invitados. Pagará la reparación o, si no la hay, el valor de reposición.',
        has('lateFee')
          ? `Retraso. Por cada día de retraso en la devolución, EL ARRENDATARIO pagará ${text('lateFee')}.`
          : undefined,
        has('guarantee')
          ? `Garantía. EL ARRENDATARIO deja como garantía: ${text('guarantee')}, que se le devolverá al cumplir este contrato.`
          : undefined,
      ],
      annex: [
        { type: 'pageBreak' },
        { type: 'title', text: 'RELACIÓN DE ARTÍCULOS' },
        { type: 'text', text: `Anexo al Contrato de Renta Folio No. ${folioText(doc.folio)}` },
        itemsTable(doc.items, 'Valor unitario de reposición'),
        {
          type: 'signatures',
          people: [
            { role: 'EL ARRENDADOR (entrega)', name: text('ownerName') },
            { role: 'EL ARRENDATARIO (recibe de conformidad)', name: text('clientName') },
          ],
        },
      ],
    })
  },
}

export const TEMPLATES: Record<DocumentKind, Template> = {
  promissory: promissoryTemplate,
  'promissory-rental': promissoryRentalTemplate,
  sale: saleTemplate,
  service: serviceTemplate,
  rental: rentalTemplate,
}

export const templateName = (kind: DocumentKind) => TEMPLATES[kind].name

/** La cantidad principal del documento. */
export function documentAmount(doc: Pick<BusinessDocument, 'kind' | 'values' | 'items'>): number {
  return TEMPLATES[doc.kind].items?.totalIsAmount ? itemsTotal(doc.items) : Number(doc.values.amount ?? 0) || 0
}
