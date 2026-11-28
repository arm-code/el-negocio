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
import { documentsMeta } from '@el-negocio/tool-documents/meta'
import { salesNotesMeta } from '@el-negocio/tool-sales-notes/meta'

export interface NavItem {
    label: string
    shortLabel: string
    href: string
    icon: LucideIcon
    // Para resaltar la ruta activa cuando hay subrutas
    matchPrefix?: string
    /** Solo en el menú lateral: la barra inferior del celular ya va llena. */
    sideOnly?: boolean
}

// Menú del panel. La barra inferior del celular omite los marcados `sideOnly`.
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
        label: documentsMeta.title,
        shortLabel: documentsMeta.shortTitle,
        href: '/tools/documentos',
        icon: documentsMeta.icon,
        matchPrefix: '/tools/documentos',
        sideOnly: true,
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
