'use client'

import { cn } from '@/lib/utils'
import { ROLES, type TeamRole } from '@/lib/api/team'

/** Tipo de acceso, explicando qué puede hacer cada uno. */
export function RoleOptions({
  value,
  onChange,
  disabled,
}: {
  value: TeamRole
  onChange: (role: TeamRole) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">¿Qué podrá hacer?</legend>
      {(Object.keys(ROLES) as TeamRole[]).map((role) => (
        <label
          key={role}
          className={cn(
            'flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors',
            value === role ? 'border-primary bg-primary/5' : 'bg-card',
            disabled && 'cursor-default opacity-60'
          )}
        >
          <input
            type="radio"
            name="role"
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <span>
            <span className="block text-base font-medium">{ROLES[role].label}</span>
            <span className="block text-pretty text-sm text-muted-foreground">{ROLES[role].description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
