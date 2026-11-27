import {
    FilePlus2,
    FileText,
    LayoutDashboard,
    Settings,
    Wallet,
    Package,
    type LucideIcon,
} from 'lucide-react'
import { agendaMeta } from '@el-negocio/tool-agenda/meta'
import { cashMeta } from '@el-negocio/tool-cash/meta'
import { salesNotesMeta } from '@el-negocio/tool-sales-notes/meta'

export interface NavItem {
    label: string
    shortLabel: string
    href: string
    icon: LucideIcon
    // Para resaltar la ruta activa cuando hay subrutas
    matchPrefix?: string
}

// Elementos principales (usados en barra inferior móvil, máx. 5)
export const primaryNav: NavItem[] = [
    { label: 'Inicio', shortLabel: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
    {
        label: salesNotesMeta.title,
        shortLabel: salesNotesMeta.shortTitle,
        href: '/tools/notas-venta',
        icon: FileText,
        matchPrefix: '/tools/notas-venta',
    },
    {
        label: cashMeta.title,
        shortLabel: cashMeta.shortTitle,
        href: '/tools/finanzas',
        icon: Wallet,
        matchPrefix: '/tools/finanzas',
    },
    {
        label: agendaMeta.title,
        shortLabel: agendaMeta.shortTitle,
        href: '/tools/eventos',
        icon: agendaMeta.icon,
        matchPrefix: '/tools/eventos',
    },
    {
        label: 'Inventario',
        shortLabel: 'Inventario',
        href: '/tools/inventario',
        icon: Package,
        matchPrefix: '/tools/inventario',
    },
    { label: 'Configuración', shortLabel: 'Ajustes', href: '/configuracion', icon: Settings },
]



export function isActive(pathname: string, item: NavItem): boolean {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
    return pathname === item.href
}
