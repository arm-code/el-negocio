// El equipo del negocio: quiénes pueden entrar y con qué tipo de acceso.

import { axiosInstance } from '@/lib/api/axios'

/** Los mismos límites que el API. */
export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 72

export type TeamRole = 'admin' | 'editor'

export const ROLES: Record<TeamRole, { label: string; description: string }> = {
  editor: {
    label: 'Empleado',
    description: 'Usa la agenda, las notas, los contratos y el inventario. No ve la caja ni los ajustes.',
  },
  admin: { label: 'Administrador', description: 'Puede ver y cambiar todo, incluido el equipo.' },
}

export const roleLabel = (role: string) => ROLES[role as TeamRole]?.label ?? 'Solo consulta'

export interface TeamMember {
  id: string
  name: string | null
  email: string
  role: TeamRole | 'viewer'
  /** `invited`: todavía no crea su contraseña. */
  status: 'active' | 'invited'
  isOwner: boolean
  isYou: boolean
}

export interface AccessLink {
  token: string
  expiresAt: string
}

const memberPath = (id: string) => `/v1/team/${encodeURIComponent(id)}`

export const teamApi = {
  async list() {
    return (await axiosInstance.get<TeamMember[]>('/v1/team')).data
  },
  async add(input: { name: string; email: string; role: TeamRole }) {
    return (await axiosInstance.post<{ member: TeamMember; link: AccessLink }>('/v1/team', input)).data
  },
  async update(id: string, input: { name?: string; role?: TeamRole }) {
    return (await axiosInstance.patch<TeamMember>(memberPath(id), input)).data
  },
  async newLink(id: string) {
    return (await axiosInstance.post<AccessLink>(`${memberPath(id)}/access-link`)).data
  },
  async remove(id: string) {
    await axiosInstance.delete(memberPath(id))
  },
}

export const accessApi = {
  async check(token: string) {
    return (await axiosInstance.post<{ name: string | null; email: string }>('/v1/auth/access/check', { token }))
      .data
  },
  async redeem(token: string, password: string) {
    await axiosInstance.post('/v1/auth/access', { token, password })
  },
}

/** El código va después de `#`: el navegador no lo manda al servidor ni queda en sus registros. */
export const accessUrl = (token: string) => `${window.location.origin}/activar#${token}`
