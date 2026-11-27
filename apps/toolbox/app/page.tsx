// app/page.tsx
import { ChevronDown } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolShowcase } from "@/components/home/tool-showcase"
import { availableTools, upcomingTools } from "@/lib/tools-catalog"
import { cn } from "@el-negocio/ui/utils"

const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

export default function HomePage() {
  return (
    // landing: activa la paleta colorida (ver globals.css)
    <div className="landing flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* 1. Qué es, en una frase: lo importante son las herramientas de abajo */}
        <section className="mx-auto max-w-4xl space-y-3 px-4 pb-6 pt-8 sm:pt-12">
          <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Gratis y sin cuenta
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Tu negocio, organizado desde el celular
          </h1>
        </section>

        {/* 2. Herramientas que ya funcionan */}
        <section
          id="herramientas"
          aria-labelledby="tools-title"
          className="mx-auto max-w-4xl scroll-mt-20 px-4 pb-12 sm:pb-16"
        >
          <h2 id="tools-title" className="sr-only">
            Herramientas listas para usar
          </h2>

          <ul className={cn("grid gap-4", availableTools.length > 1 && "sm:grid-cols-2")}>
            {availableTools.map((tool, index) => {
              // Si son impares, la última ocupa todo el ancho para no dejar un hueco
              const wide = availableTools.length % 2 === 1 && index === availableTools.length - 1
              return (
                <li key={tool.id} className={cn(wide && "sm:col-span-2")}>
                  <ToolShowcase tool={tool} wide={wide} />
                </li>
              )
            })}
          </ul>
        </section>

        {/* 3. Próximamente: banda con otro fondo y colapsada para no saturar */}
        <section aria-labelledby="soon-title" className="border-t bg-secondary/40">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
            <details className="group">
              <summary
                className={cn(
                  "flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg [&::-webkit-details-marker]:hidden",
                  focusRing
                )}
              >
                <h2 id="soon-title" className="mr-auto text-xl font-semibold tracking-tight">
                  Próximamente
                </h2>
                <span className="text-sm text-muted-foreground">{upcomingTools.length} herramientas</span>
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>

              <ul className="mt-4 divide-y rounded-2xl border bg-card">
                {upcomingTools.map((tool) => (
                  <li key={tool.id} className="flex items-start gap-3 px-4 py-3.5">
                    <tool.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{tool.title}</p>
                      <p className="text-pretty text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}