// lib/tools-catalog.ts
// Fuente única de verdad de las micro apps. La landing y el footer leen de aquí,
// así que cuando una herramienta salga basta con quitarla de `upcomingTools` y
// agregar a `availableTools` la ficha de su paquete junto con su `href` y su muestra.
// Los nombres siguen el apartado "Nombres" de docs/PACKAGES-TOOLS.md.
import type { ComponentType } from "react"
import { cashMeta } from "@el-negocio/tool-cash/meta"
import { salesNotesMeta } from "@el-negocio/tool-sales-notes/meta"
import {
    FileSignature,
    Calculator,
    BookOpen,
    Package,
    Tag,
    BarChart3,
    Users,
    type LucideIcon,
} from "lucide-react"
import { CashPreview } from "@/components/home/cash-preview"
import { ReceiptPreview } from "@/components/home/receipt-preview"

interface ToolBase {
    id: string
    title: string
    description: string
    icon: LucideIcon
}

export interface AvailableTool extends ToolBase {
    href: string
    /** Texto del botón: lo que la persona va a hacer. */
    action: string
    /** Otros nombres con los que la gente busca lo mismo. */
    alsoKnownAs: string
    /** Muestra visual de lo que se obtiene (decorativa). */
    preview: ComponentType
}

export type UpcomingTool = ToolBase

export const availableTools: readonly AvailableTool[] = [
    {
        ...salesNotesMeta,
        href: "/tools/sales-note",
        action: "Hacer una nota",
        alsoKnownAs: "Nota de venta, ticket, comprobante o cotización.",
        preview: ReceiptPreview,
    },
    {
        ...cashMeta,
        href: "/tools/cash",
        action: "Abrir mi caja",
        alsoKnownAs: "Ingresos y gastos, cuentas del día, lo que hay en caja.",
        preview: CashPreview,
    },
]

export const upcomingTools: readonly UpcomingTool[] = [
    {
        id: "event-contracts",
        title: "Contratos de renta",
        description: "Contratos para tus eventos, listos para firmar",
        icon: FileSignature,
    },
    {
        id: "daily-close",
        title: "Corte de caja",
        description: "Cierra el día y ve cuánto quedó",
        icon: Calculator,
    },
    {
        id: "credit-book",
        title: "Libreta de fiado",
        description: "Quién te debe y cuánto, sin el cuaderno",
        icon: BookOpen,
    },
    {
        id: "inventory",
        title: "Inventario",
        description: "Lo que tienes y lo que se te está acabando",
        icon: Package,
    },
    {
        id: "price-calculator",
        title: "Calculadora de precios",
        description: "Súmale tu ganancia al costo y sabe en cuánto venderlo",
        icon: Tag,
    },
    {
        id: "sales-reports",
        title: "Mis ventas",
        description: "Ve cuánto vendes y qué se vende más",
        icon: BarChart3,
    },
    {
        id: "customers",
        title: "Mis clientes",
        description: "Sus datos y lo que te han comprado",
        icon: Users,
    },
]
