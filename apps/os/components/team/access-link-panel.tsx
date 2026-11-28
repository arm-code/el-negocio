'use client'

import { Copy, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { accessUrl } from '@/lib/api/team'

/** El enlace recién creado, con las dos formas de hacérselo llegar a la persona. */
export function AccessLinkPanel({ name, token }: { name: string; token: string }) {
  const url = accessUrl(token)
  const message = `Hola ${name}, con este enlace creas tu contraseña para entrar: ${url}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar. Mantén presionado el enlace para copiarlo.')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-pretty text-base leading-relaxed">
        Mándale este enlace a <strong>{name}</strong> para que cree su contraseña. Sirve una sola vez,
        durante 3 días.
      </p>
      <p className="select-all break-all rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{url}</p>
      <Button asChild className="h-12 w-full text-base">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden />
          Mandar por WhatsApp
        </a>
      </Button>
      <Button variant="outline" className="h-12 w-full text-base" onClick={copy}>
        <Copy aria-hidden />
        Copiar enlace
      </Button>
    </div>
  )
}
