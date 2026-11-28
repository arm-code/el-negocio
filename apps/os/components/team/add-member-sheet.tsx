'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AppBottomSheet } from '@/components/ui/app-bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { teamApi, type TeamRole } from '@/lib/api/team'
import { AccessLinkPanel } from './access-link-panel'
import { RoleOptions } from './role-options'

const FORM_ID = 'add-member'

/** Alta en dos pasos: sus datos y, ya guardado, el enlace para mandárselo. */
export function AddMemberSheet({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('editor')

  const add = useMutation({
    mutationFn: () => teamApi.add({ name: name.trim(), email: email.trim(), role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <AppBottomSheet
      open
      onOpenChange={(open) => !open && !add.isPending && onClose()}
      title={add.data ? 'Ya está en tu equipo' : 'Agregar persona'}
      footer={
        add.data ? (
          <Button variant="outline" className="h-12 w-full text-base" onClick={onClose}>
            Listo
          </Button>
        ) : (
          <Button type="submit" form={FORM_ID} className="h-12 w-full text-base" disabled={add.isPending}>
            {add.isPending ? 'Guardando…' : 'Agregar'}
          </Button>
        )
      }
    >
      {add.data ? (
        <AccessLinkPanel name={add.data.member.name ?? name} token={add.data.link.token} />
      ) : (
        <form
          id={FORM_ID}
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return void toast.error('Escribe el nombre.')
            add.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Nombre</Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              autoComplete="off"
              required
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Correo</Label>
            <Input
              id="member-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              autoComplete="off"
              required
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">Con este correo va a entrar.</p>
          </div>
          <RoleOptions value={role} onChange={setRole} />
        </form>
      )}
    </AppBottomSheet>
  )
}
