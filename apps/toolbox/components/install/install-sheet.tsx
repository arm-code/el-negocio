"use client"

// Hoja que explica cómo poner el sitio en la pantalla de inicio, según el dispositivo.

import { Download, EllipsisVertical, Share, Smartphone, SquarePlus } from "lucide-react"
import { AppBottomSheet } from "@el-negocio/ui/app-bottom-sheet"
import { Button } from "@el-negocio/ui/button"
import { promptInstall, useInstallState } from "@/lib/install"

interface InstallSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Cuando aparece sola, después de usar una herramienta. */
    invite?: boolean
}

function Step({ icon: Icon, children }: { icon: typeof Share; children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-base leading-snug">{children}</span>
        </li>
    )
}

export function InstallSheet({ open, onOpenChange, invite }: InstallSheetProps) {
    const state = useInstallState()

    return (
        <AppBottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title={invite ? "¿Te está sirviendo?" : "Instálala en tu teléfono"}
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Smartphone className="size-6" aria-hidden="true" />
                    </span>
                    <p className="text-pretty text-base leading-relaxed">
                        {invite && "Ponla en tu teléfono. "}
                        La abres desde tu pantalla de inicio, como cualquier app, y funciona también
                        sin internet.
                    </p>
                </div>

                {state === "button" && (
                    <Button
                        type="button"
                        className="h-14 w-full rounded-2xl text-lg"
                        onClick={async () => {
                            onOpenChange(false)
                            await promptInstall()
                        }}
                    >
                        <Download className="size-5" aria-hidden="true" />
                        Instalar
                    </Button>
                )}

                {state === "ios" && (
                    <ol className="space-y-2">
                        <Step icon={Share}>
                            Toca <strong>Compartir</strong> en tu navegador
                        </Step>
                        <Step icon={SquarePlus}>
                            Elige <strong>Agregar a inicio</strong>
                        </Step>
                    </ol>
                )}

                {state === "menu" && (
                    <ol className="space-y-2">
                        <Step icon={EllipsisVertical}>Abre el menú de tu navegador</Step>
                        <Step icon={SquarePlus}>
                            Elige <strong>Instalar app</strong> o{" "}
                            <strong>Agregar a pantalla principal</strong>
                        </Step>
                    </ol>
                )}

                <Button
                    type="button"
                    variant="ghost"
                    className="h-12 w-full rounded-xl text-base text-muted-foreground"
                    onClick={() => onOpenChange(false)}
                >
                    {invite ? "Ahora no" : "Cerrar"}
                </Button>
            </div>
        </AppBottomSheet>
    )
}
