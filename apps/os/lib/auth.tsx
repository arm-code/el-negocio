'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { ApiError, axiosInstance } from '@/lib/api/axios'

/** `editor` es un empleado; `viewer` solo consulta. */
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  /** El API ya no reconoce la sesión (venció o quitaron el acceso). */
  expired: boolean
  /** Vuelve a consultar la sesión (llamar tras iniciar sesión). */
  refresh: () => Promise<void>
  signOut: (redirectTo?: unknown) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  expired: false,
  refresh: async () => {},
  signOut: async () => {},
})

interface MeResponse {
  id: string
  email: string
  name: string | null
  role: UserRole
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)

  // La sesión vive en una cookie httpOnly: la única forma de saber si hay
  // sesión es preguntarle al API.
  const refresh = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<MeResponse>('/v1/auth/me')
      setUser({
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0] || 'Usuario',
        role: data.role,
      })
      setExpired(false)
    } catch (error) {
      // Sin conexión no se cierra la sesión: solo cuando el API la rechaza
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setExpired(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Al volver a la app se revisa si cambió el acceso
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [refresh])

  // Algunos botones pasan `signOut` directo como onClick: el argumento puede ser un evento
  const signOut = useCallback(async (redirectArg?: unknown) => {
    const redirectTo = typeof redirectArg === 'string' ? redirectArg : '/'
    try {
      await axiosInstance.post('/v1/auth/logout')
    } finally {
      setUser(null)
      window.location.href = redirectTo
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin: user?.role === 'admin', expired, refresh, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
