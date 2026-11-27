// Con qué empieza un documento nuevo, para teclear lo menos posible.

import { toLocalDateInput } from '@el-negocio/ui/display'
import type { BusinessDocument, DocumentInput, DocumentKind, DocumentSeed, DocumentValues } from '../types'
import { REMEMBERED } from './fields'
import { TEMPLATES } from './templates'

export function newDraft(
  kind: DocumentKind,
  previous: BusinessDocument[],
  businessDefaults: DocumentValues = {},
  seed: DocumentSeed = {}
): DocumentInput {
  const template = TEMPLATES[kind]
  const keys = new Set(template.sections.flatMap((section) => section.fields.map((field) => field.key)))
  const newest = [...previous].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const values: DocumentValues = {}
  // De menos a más importante: lo del formato, lo del negocio, lo último usado y lo que
  // viene de donde se pidió el documento
  Object.assign(values, template.defaults)
  for (const key of keys) {
    if (businessDefaults[key]) values[key] = businessDefaults[key]
    if (REMEMBERED.includes(key)) {
      const last = newest.find((doc) => doc.values[key]?.trim())
      if (last) values[key] = last.values[key]
    }
    if (seed.values?.[key]) values[key] = seed.values[key]
  }
  if (keys.has('date')) values.date = toLocalDateInput()

  return {
    kind,
    values,
    items: template.items ? (seed.items ?? []) : [],
    eventId: seed.eventId,
  }
}
