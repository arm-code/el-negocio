'use client'

// Un documento ya hecho: se revisa, se manda o se descarga.

import { useMemo, useState } from 'react'
import { Download, Loader2, Pencil, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { TOUCH } from '@el-negocio/ui/detail'
import { toSlug } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { folioText } from '../lib/format'
import { toPdf } from '../lib/pdf'
import { TEMPLATES } from '../lib/templates'
import type { BusinessDocument } from '../types'
import { Paper } from './paper'

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.addEventListener('click', (e) => e.stopPropagation())
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Algunos navegadores leen el archivo después del clic
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

interface DocumentViewProps {
  document: BusinessDocument | null
  onClose: () => void
  onEdit: (document: BusinessDocument) => void
  onDelete: (document: BusinessDocument) => void
}

export function DocumentView({ document: doc, onClose, onEdit, onDelete }: DocumentViewProps) {
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const blocks = useMemo(() => (doc ? TEMPLATES[doc.kind].build(doc) : []), [doc])

  async function send(action: 'download' | 'share') {
    if (!doc || busy) return
    setBusy(action)
    try {
      const folio = folioText(doc.folio)
      const name = `${toSlug(`${TEMPLATES[doc.kind].name} ${folio} ${doc.values.clientName ?? ''}`, 'documento')}.pdf`
      const file = new File([await toPdf(blocks, folio)], name, { type: 'application/pdf' })
      if (action === 'share' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: name, files: [file] })
      } else {
        download(file)
        toast.success('Documento descargado', { description: name })
      }
    } catch (error) {
      // Cerrar el menú de compartir del teléfono no es un error
      if ((error as Error).name !== 'AbortError') toast.error('No se pudo preparar el PDF. Inténtalo de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AppBottomSheet
      open={doc !== null}
      onOpenChange={(open) => !open && onClose()}
      title={doc ? `${TEMPLATES[doc.kind].name} ${folioText(doc.folio)}` : ''}
      mobileHeight="92dvh"
      headerAction={
        doc && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Corregir"
            onClick={() => onEdit(doc)}
          >
            <Pencil className="size-5" aria-hidden="true" />
          </Button>
        )
      }
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className={TOUCH} onClick={() => send('download')} disabled={busy !== null}>
            {busy === 'download' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
            Descargar PDF
          </Button>
          <Button className={TOUCH} onClick={() => send('share')} disabled={busy !== null}>
            {busy === 'share' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            Compartir
          </Button>
        </div>
      }
    >
      {doc && (
        <div className="space-y-4">
          <Paper blocks={blocks} />
          <Button
            variant="ghost"
            className={cn(TOUCH, 'w-full text-destructive hover:bg-destructive/10 hover:text-destructive')}
            onClick={() => onDelete(doc)}
          >
            <Trash2 aria-hidden="true" />
            Borrar
          </Button>
        </div>
      )}
    </AppBottomSheet>
  )
}
