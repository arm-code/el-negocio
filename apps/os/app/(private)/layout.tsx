'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminBottomNav } from '@/components/admin/admin-bottom'
import { Button } from '@/components/ui/button'
import { EmptyState, ListSkeleton } from '@/components/ui/states'
import { useAuth } from '@/lib/auth'
import { isAdminPath } from '@/lib/nav'

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin, expired, signOut } = useAuth()
  const pathname = usePathname()

  // La cookie puede seguir firmada aunque ya no valga: se borra y se pide entrar
  useEffect(() => {
    if (expired) void signOut('/auth/login')
  }, [expired, signOut])

  let content = children
  if (isAdminPath(pathname) && !isAdmin) {
    content = loading ? (
      <ListSkeleton label="Revisando tu acceso" />
    ) : (
      <EmptyState
        title="Esta parte es del administrador"
        description="Si la necesitas, pídele que cambie tu tipo de acceso."
        action={
          <Button asChild className="h-11">
            <Link href="/dashboard">Ir al inicio</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50/50">
      <AdminHeader />
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-28 md:pb-8 max-w-7xl w-full mx-auto">
          {content}
        </main>
      </div>
      <AdminBottomNav />
    </div>
  )
}
