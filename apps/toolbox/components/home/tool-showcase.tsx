// Escaparate de una micro app: en vez de una tarjeta con ícono, enseña lo que se
// obtiene al usarla, para que se entienda de un vistazo. Todo el bloque es el enlace.

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@el-negocio/ui/utils"
import type { AvailableTool } from "@/lib/tools-catalog"

interface ToolShowcaseProps {
    tool: AvailableTool
    /** Con una sola herramienta ocupa todo el ancho: muestra y texto lado a lado. */
    wide?: boolean
}

export function ToolShowcase({ tool, wide }: ToolShowcaseProps) {
    const { preview: Preview } = tool

    return (
        <Link
            href={tool.href}
            className={cn(
                "group grid overflow-hidden rounded-3xl border-2 border-primary/20 bg-card",
                "outline-none transition-colors hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                wide && "md:grid-cols-2"
            )}
        >
            {/* La muestra se asoma recortada: así el botón queda a la vista en el celular */}
            <div className={cn("relative h-64 overflow-hidden bg-primary/10 px-10 pt-6", wide && "md:h-80")}>
                <div aria-hidden="true" className="hero-grid absolute inset-0" />
                <div className="relative mx-auto w-full max-w-[17rem] transition-transform duration-300 group-hover:-translate-y-2 motion-reduce:transition-none">
                    <Preview />
                </div>
            </div>

            <div className="flex flex-col justify-center gap-2 p-5 sm:p-7">
                <h3 className="text-2xl font-bold tracking-tight">{tool.title}</h3>
                <p className="text-pretty text-base leading-relaxed">{tool.description}</p>
                <p className="text-pretty text-sm text-muted-foreground">{tool.alsoKnownAs}</p>
                <span className="mt-3 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-lg font-semibold text-primary-foreground">
                    {tool.action}
                    <ArrowRight
                        className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                        aria-hidden="true"
                    />
                </span>
            </div>
        </Link>
    )
}
