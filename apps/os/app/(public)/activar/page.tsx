'use client'

// Crear (o recuperar) la contraseña con el enlace que manda el administrador.
import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { accessApi, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/api/team'
import { ApiError } from '@/lib/api/axios'

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export default function ActivarPage() {
  // `null` mientras se dibuja en el servidor, que no ve lo que va después de `#`
  const token = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => null
  )

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-8 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        {token === null ? <Skeleton className="h-40 w-full" /> : <Activate key={token} token={token} />}
      </div>
    </div>
  )
}

function Activate({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [visible, setVisible] = useState(false)
  const [problem, setProblem] = useState('')

  const owner = useQuery({
    queryKey: ['access', token],
    queryFn: () => accessApi.check(token),
    enabled: token !== '',
    retry: false,
    gcTime: 0,
  })

  const save = useMutation({
    mutationFn: () => accessApi.redeem(token, password),
    // Carga completa: no debe quedar nada en memoria de quien usaba antes este celular
    onSuccess: () => window.location.replace('/dashboard'),
    onError: (error: Error) => setProblem(error.message),
  })

  if (token === '' || owner.isError) {
    const offline = owner.error && !(owner.error instanceof ApiError)
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold">{offline ? 'No hay conexión' : 'Este enlace ya no sirve'}</h1>
        <p className="text-pretty text-[15px] text-muted-foreground">
          {offline ? 'Revisa tu internet y vuelve a intentar.' : 'Pide uno nuevo a tu administrador.'}
        </p>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={() => (offline ? owner.refetch() : router.push('/auth/login'))}
        >
          {offline ? 'Reintentar' : 'Ir a iniciar sesión'}
        </Button>
      </div>
    )
  }

  if (!owner.data) return <Skeleton className="h-40 w-full" />

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (password.length < MIN_PASSWORD_LENGTH) {
          return setProblem(`Usa al menos ${MIN_PASSWORD_LENGTH} letras o números.`)
        }
        if (password !== repeat) return setProblem('Las dos contraseñas no son iguales.')
        setProblem('')
        save.mutate()
      }}
    >
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-balance">Hola{owner.data.name ? `, ${owner.data.name}` : ''}</h1>
        <p className="text-pretty text-[15px] text-muted-foreground">
          Crea la contraseña con la que vas a entrar con <strong>{owner.data.email}</strong>.
        </p>
      </div>
      {/* Para que el celular guarde la contraseña con su correo */}
      <input type="email" autoComplete="username" value={owner.data.email} readOnly hidden />

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <div className="relative">
          <Input
            id="password"
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            maxLength={MAX_PASSWORD_LENGTH}
            required
            className="h-12 pr-12 text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-muted-foreground"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Al menos {MIN_PASSWORD_LENGTH} letras o números.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="repeat">Escríbela otra vez</Label>
        <Input
          id="repeat"
          type={visible ? 'text' : 'password'}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          autoComplete="new-password"
          maxLength={MAX_PASSWORD_LENGTH}
          required
          className="h-12 text-base"
        />
      </div>

      {problem && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {problem}
        </p>
      )}

      <Button type="submit" className="h-12 w-full text-base" disabled={save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar y entrar'}
      </Button>
    </form>
  )
}
