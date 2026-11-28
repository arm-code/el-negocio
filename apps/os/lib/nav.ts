import {
    FilePlus2,
    FileText,
    LayoutDashboard,
    Settings,
    Wallet,
    Package,
    UsersRound,
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
    /** Solo para administradores. */
    adminOnly?: boolean
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
        adminOnly: true,
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
    {
        label: 'Equipo',
        shortLabel: 'Equipo',
        href: '/equipo',
        icon: UsersRound,
        sideOnly: true,
        adminOnly: true,
    },
    { label: 'Configuración', shortLabel: 'Ajustes', href: '/configuracion', icon: Settings, adminOnly: true },
]

/** Lo que ve cada quien en el menú. */
export function navFor(isAdmin: boolean): NavItem[] {
    return primaryNav.filter((item) => isAdmin || !item.adminOnly)
}

// El API es quien de verdad lo impide; esto evita enseñar pantallas que fallarían
const ADMIN_PATHS = ['/tools/finanzas', '/configuracion', '/equipo', '/gestion-productos']

export function isAdminPath(pathname: string): boolean {
    return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}



export function isActive(pathname: string, item: NavItem): boolean {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
    return pathname === item.href
}
