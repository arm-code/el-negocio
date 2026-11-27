'use client'

import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { CashHome } from '@el-negocio/tool-cash'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function EntradasSalidasPage() {
  return <CashHome headerAction={<SettingsMenu />} />
}

function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Ajustes de entradas y salidas"
        >
          <Settings2 className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">Ajustes</DropdownMenuLabel>
        <DropdownMenuItem asChild className="min-h-11 rounded-lg text-[15px]">
          <Link href="/tools/finanzas/categorias">Categorías</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 rounded-lg text-[15px]">
          <Link href="/tools/finanzas/formas-de-pago">Formas de pago</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}