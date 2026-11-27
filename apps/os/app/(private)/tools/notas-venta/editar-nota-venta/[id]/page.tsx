'use client'

import { use } from 'react'
import { EditNote } from '@el-negocio/tool-sales-notes'

export default function EditarNotaVentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditNote noteId={id} />
}
