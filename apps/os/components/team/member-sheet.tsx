'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@/components/ui/app-bottom-sheet'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { teamApi, type TeamMember, type TeamRole } from '@/lib/api/team'
import { useAuth } from '@/lib/auth'
import { AccessLinkPanel } from './access-link-panel'
import { RoleOptions } from './role-options'

const FORM_ID = 'edit-member'

export function MemberSheet({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { refresh } = useAuth()
  const [name, setName] = useState(member.name ?? '')
  const [role, setRole] = useState<TeamRole>(member.role === 'admin' ? 'admin' : 'editor')
  const [removing, setRemoving] = useState(false)

  // La cuenta principal solo la cambia su dueño
  const locked = member.isOwner && !member.isYou
  const displayName = member.name || member.email

  const reload = () => queryClient.invalidateQueries({ queryKey: ['team'] })
  const onError = (error: Error) => toast.error(error.message)

  const save = useMutation({
    mutationFn: () =>
      teamApi.update(member.id, {
        name: name.trim(),
        // Sin tocar el tipo de acceso no se envía: así "Solo consulta" se conserva
        role: !member.isYou && role !== member.role ? role : undefined,
      }),
    onSuccess: async () => {
      await reload()
      if (member.isYou) await refresh()
      toast.success('Cambios guardados')
      onClose()
    },
    onError,
  })
  const link = useMutation({
    mutationFn: () => teamApi.newLink(member.id),
    onSuccess: reload,
    onError,
  })
  const remove = useMutation({
    mutationFn: () => teamApi.remove(member.id),
    onSuccess: async () => {
      await reload()
      toast.success('Se quitó su acceso')
      onClose()
    },
    onError,
  })

  return (
    <>
      <AppBottomSheet
        open
        onOpenChange={(open) => !open && onClose()}
        title={displayName}
        description={member.email}
        footer={
          link.data ? (
            <Button variant="outline" className="h-12 w-full text-base" onClick={onClose}>
              Listo
            </Button>
          ) : locked ? undefined : (
            <Button type="submit" form={FORM_ID} className="h-12 w-full text-base" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          )
        }
      >
        {link.data ? (
          <AccessLinkPanel name={displayName} token={link.data.token} />
        ) : locked ? (
          <p className="text-pretty text-base text-muted-foreground">
            Esta es la cuenta principal del negocio. Solo su dueño puede cambiarla.
          </p>
        ) : (
          <div className="space-y-6">
            <form
              id={FORM_ID}
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (!name.trim()) return void toast.error('Escribe el nombre.')
                save.mutate()
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  autoComplete="off"
                  required
                  className="h-12 text-base"
                />
              </div>
              {!member.isYou && <RoleOptions value={role} onChange={setRole} />}
            </form>

            {!member.isYou && (
              <div className="space-y-2 border-t pt-4">
                <Button
                  variant="outline"
                  className="h-12 w-full text-base"
                  disabled={link.isPending}
                  onClick={() => link.mutate()}
                >
                  <KeyRound aria-hidden />
                  {member.status === 'invited' ? 'Crear enlace para entrar' : 'Olvidó su contraseña'}
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 w-full text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRemoving(true)}
                >
                  <UserMinus aria-hidden />
                  Quitar del equipo
                </Button>
              </div>
            )}
          </div>
        )}
      </AppBottomSheet>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`¿Quitar a ${displayName}?`}
        description="Ya no podrá entrar. Lo que anotó se queda en tu negocio."
        confirmText="Quitar"
        cancelText="No"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </>
  )
}
