'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { AddMemberSheet } from '@/components/team/add-member-sheet'
import { MemberSheet } from '@/components/team/member-sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InlineError, ListSkeleton } from '@/components/ui/states'
import { roleLabel, teamApi } from '@/lib/api/team'
import { useAuth } from '@/lib/auth'

export default function EquipoPage() {
  const { isAdmin } = useAuth()
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const team = useQuery({ queryKey: ['team'], queryFn: teamApi.list, enabled: isAdmin, staleTime: 0 })
  // De la lista, para que la hoja muestre lo recién guardado
  const selected = team.data?.find((member) => member.id === selectedId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="Quiénes pueden entrar a tu negocio."
        action={
          <Button className="h-11 w-full sm:w-auto" onClick={() => setAdding(true)}>
            <UserPlus aria-hidden />
            Agregar persona
          </Button>
        }
      />

      {team.isError ? (
        <InlineError message="No se pudo cargar tu equipo." onRetry={() => team.refetch()} />
      ) : !team.data ? (
        <ListSkeleton rows={3} label="Cargando tu equipo" />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <ul className="divide-y">
            {team.data.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(member.id)}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent active:bg-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">
                      {member.name || member.email}
                      {member.isYou && <span className="font-normal text-muted-foreground"> (tú)</span>}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {roleLabel(member.role)}
                      {member.status === 'invited' && ' · todavía no entra'}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {adding && <AddMemberSheet onClose={() => setAdding(false)} />}
      {selected && <MemberSheet key={selected.id} member={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
