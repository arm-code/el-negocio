"use client"

import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, Smartphone, Upload } from "lucide-react"
import { toast } from "sonner"
import { AppBottomSheet } from "@el-negocio/ui/app-bottom-sheet"
import { Button } from "@el-negocio/ui/button"
import { BackupError, createBackup, importBackup } from "@/lib/backup"
import { useInstallState } from "@/lib/install"

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function download() {
    try {
        const backup = createBackup()
        const url = URL.createObjectURL(new Blob([backup.content], { type: "application/json" }))
        const link = document.createElement("a")
        link.href = url
        link.download = backup.fileName
        link.click()
        // Algunos navegadores leen el archivo después del clic
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
        toast.success("Respaldo descargado", {
            description: `${plural(backup.noteCount, "nota", "notas")}, ${plural(backup.movementCount, "movimiento", "movimientos")} y ${plural(backup.eventCount, "evento", "eventos")} de la agenda en ${backup.fileName}`,
        })
    } catch {
        toast.error("No se pudo crear el respaldo.")
    }
}

interface BackupSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Abre la explicación de cómo instalar la app. */
    onInstall: () => void
}

export function BackupSheet({ open, onOpenChange, onInstall }: BackupSheetProps) {
    const installState = useInstallState()
    const inputRef = useRef<HTMLInputElement>(null)
    const [importing, setImporting] = useState(false)
    const queryClient = useQueryClient()

    const handleFile = async (file: File) => {
        setImporting(true)
        try {
            const { added, updated, invalid } = await importBackup(file)
            await queryClient.invalidateQueries()
            const parts = [
                plural(added, "registro agregado", "registros agregados"),
                plural(updated, "actualizado", "actualizados"),
            ]
            if (invalid) parts.push(plural(invalid, "no se pudo leer", "no se pudieron leer"))
            toast.success("Respaldo cargado", { description: `${parts.join(", ")}.` })
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof BackupError ? error.message : "No se pudo cargar el respaldo.")
        } finally {
            setImporting(false)
        }
    }

    return (
        <AppBottomSheet open={open} onOpenChange={onOpenChange} title="Respaldo de tus datos">
            <div className="space-y-4">
                <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
                    Tus datos viven solo en este dispositivo. Descarga un respaldo de vez en cuando: si
                    cambias de celular o se borra el navegador, podrás recuperarlos.
                </p>
                <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={download}>
                    <Download className="size-5" aria-hidden="true" />
                    Descargar respaldo
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl text-base"
                    disabled={importing}
                    onClick={() => inputRef.current?.click()}
                >
                    {importing ? (
                        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                        <Upload className="size-5" aria-hidden="true" />
                    )}
                    Cargar un respaldo
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = "" // permite volver a elegir el mismo archivo
                        if (file) handleFile(file)
                    }}
                />
                <p className="text-sm text-muted-foreground">
                    Cargar un respaldo no borra nada: agrega lo que falte.
                </p>
                {installState !== "installed" && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-full justify-start rounded-xl border-t px-1 text-base"
                        onClick={() => {
                            onOpenChange(false)
                            onInstall()
                        }}
                    >
                        <Smartphone className="size-5" aria-hidden="true" />
                        Instalar en mi teléfono
                    </Button>
                )}
            </div>
        </AppBottomSheet>
    )
}
