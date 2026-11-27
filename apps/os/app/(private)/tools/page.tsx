'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FilePlus2, FileText, Wallet, Package, ArrowRight } from 'lucide-react'
import { agendaMeta } from '@el-negocio/tool-agenda/meta'
import Link from 'next/link'
import { cashMeta } from '@el-negocio/tool-cash/meta'
import { salesNotesMeta } from '@el-negocio/tool-sales-notes/meta'
import { PageHeader } from '@/components/admin/page-header'

// Nombres: ver el apartado "Nombres" de docs/PACKAGES-TOOLS.md
const toolsList = [
  {
    title: 'Nueva nota',
    description: 'Hazle su nota o cotización al cliente y mándala por WhatsApp.',
    href: '/tools/notas-venta/crear-nota-venta',
    icon: FilePlus2,
    btnLabel: 'Hacer una nota',
    primary: true,
  },
  {
    title: salesNotesMeta.title,
    description: 'Busca, vuelve a enviar o corrige las notas que ya hiciste.',
    href: '/tools/notas-venta',
    icon: FileText,
    btnLabel: 'Ver mis notas',
    primary: false,
  },
  {
    title: agendaMeta.title,
    description: 'Anota citas, pedidos y entregas, y cobra lo que te deben.',
    href: '/tools/eventos',
    icon: agendaMeta.icon,
    btnLabel: 'Abrir mi agenda',
    primary: true,
  },
  {
    title: cashMeta.title,
    description: 'Anota lo que entra y lo que sale de tu negocio.',
    href: '/tools/finanzas',
    icon: Wallet,
    btnLabel: 'Ver mi caja',
    primary: false,
  },
  {
    title: 'Inventario',
    description: 'Lo que tienes, cuánto queda y dónde está.',
    href: '/tools/inventario',
    icon: Package,
    btnLabel: 'Ver inventario',
    primary: true,
  },
]

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Herramientas"
        description="¿Qué quieres hacer?"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {toolsList.map((tool) => {
          const Icon = tool.icon
          return (
            <Card
              key={tool.href}
              className="border-violet-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-violet-50">
                <CardTitle className="text-base font-bold text-violet-950">{tool.title}</CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col justify-between flex-1 gap-4">
                <p className="text-xs leading-relaxed text-violet-600/80">{tool.description}</p>
                <Link href={tool.href} className="w-full">
                  <Button
                    className={
                      tool.primary
                        ? 'w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 shadow-sm shadow-violet-200'
                        : 'w-full h-11 border-violet-200 text-violet-700 hover:bg-violet-50 font-semibold gap-2'
                    }
                    variant={tool.primary ? 'default' : 'outline'}
                  >
                    {tool.btnLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
