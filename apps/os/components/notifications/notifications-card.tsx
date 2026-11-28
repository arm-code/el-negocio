'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellOff, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { disablePush, enablePush, pushState, testPush, type PushState } from '@/lib/push'

export const PUSH_STATE_KEY = ['push-state']

export function usePushState() {
  return useQuery({ queryKey: PUSH_STATE_KEY, queryFn: pushState, staleTime: 0, retry: false })
}

const HELP: Record<Exclude<PushState, 'off' | 'on'>, { title: string; text: string }> = {
  'ios-install': {
    title: 'Primero agrega la app a tu pantalla de inicio',
    text: 'En Safari toca el botón de compartir y elige "Agregar a inicio". Abre la app desde ese icono y regresa aquí.',
  },
  denied: {
    title: 'Los avisos están bloqueados',
    text: 'Actívalos en los ajustes de tu navegador, en los permisos de este sitio, y regresa aquí.',
  },
  unsupported: {
    title: 'Este navegador no puede recibir avisos',
    text: 'Prueba con Chrome en Android o con la app agregada a la pantalla de inicio en iPhone.',
  },
}

/** Activar, probar y apagar los avisos de este celular. */
export function NotificationsCard() {
  const queryClient = useQueryClient()
  const state = usePushState()
  const reload = () => queryClient.invalidateQueries({ queryKey: PUSH_STATE_KEY })
  const onError = (error: Error) => {
    void reload()
    toast.error(error.message || 'No se pudo. Revisa tu conexión.')
  }

  const enable = useMutation({
    mutationFn: enablePush,
    onSuccess: async () => {
      await reload()
      toast.success('Avisos activados en este celular')
    },
    onError,
  })
  const disable = useMutation({ mutationFn: disablePush, onSuccess: reload, onError })
  const test = useMutation({
    mutationFn: testPush,
    onSuccess: ({ sent }) =>
      sent > 0
        ? toast.success('Aviso enviado. Debe llegarte en unos segundos.')
        : toast.error('No se pudo enviar. Apaga los avisos y vuelve a activarlos.'),
    onError,
  })

  if (state.isError) {
    return (
      <Card className="px-5 py-4">
        <p className="text-[15px] text-muted-foreground">No se pudo revisar este celular. Vuelve a intentar.</p>
        <Button variant="outline" onClick={() => state.refetch()}>
          Reintentar
        </Button>
      </Card>
    )
  }
  if (!state.data) return <Skeleton className="h-40 w-full rounded-xl" />

  if (state.data !== 'off' && state.data !== 'on') {
    const help = HELP[state.data]
    return (
      <Card className="gap-2 px-5 py-5">
        <p className="flex items-center gap-2 text-base font-semibold">
          <BellOff className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          {help.title}
        </p>
        <p className="text-pretty text-[15px] text-muted-foreground">{help.text}</p>
      </Card>
    )
  }

  const on = state.data === 'on'
  return (
    <Card className="gap-4 px-5 py-5">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-base font-semibold">
          {on ? (
            <BellRing className="size-5 shrink-0 text-primary" aria-hidden />
          ) : (
            <BellOff className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          {on ? 'Este celular recibe avisos' : 'Este celular no recibe avisos'}
        </p>
        <p className="text-pretty text-[15px] text-muted-foreground">
          Te avisamos cuando alguien agenda, cambia o cancela algo, cada mañana lo de hoy y mañana, y una
          hora antes de lo que tiene hora.
        </p>
      </div>

      {on ? (
        <div className="space-y-2">
          <Button className="h-12 w-full text-base" disabled={test.isPending} onClick={() => test.mutate()}>
            {test.isPending ? 'Enviando…' : 'Mandarme un aviso de prueba'}
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full text-base text-muted-foreground"
            disabled={disable.isPending}
            onClick={() => disable.mutate()}
          >
            Dejar de recibirlos aquí
          </Button>
        </div>
      ) : (
        <Button className="h-12 w-full text-base" disabled={enable.isPending} onClick={() => enable.mutate()}>
          {enable.isPending ? 'Activando…' : 'Avisarme en este celular'}
        </Button>
      )}
    </Card>
  )
}
