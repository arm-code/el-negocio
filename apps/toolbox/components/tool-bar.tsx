"use client"

// Barra fija de todas las micro apps: deja claro, también en la app instalada (sin
// barra de direcciones), que esto es el sitio gratuito y dónde quedan los datos.

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { DatabaseBackup } from "lucide-react"
import { BackupSheet } from "@/components/backup-sheet"
import { InstallSheet } from "@/components/install/install-sheet"
import { Button } from "@el-negocio/ui/button"
import { BRAND } from "@/lib/brand"

export function ToolBar() {
    const [backupOpen, setBackupOpen] = useState(false)
    const [installOpen, setInstallOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
            <div className="mx-auto flex min-h-14 max-w-4xl items-center gap-3 py-1.5">
                <Link
                    href="/"
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <Image
                        src="/icon_192x192_nobg.png"
                        alt=""
                        width={32}
                        height={32}
                        className="shrink-0 object-contain"
                        priority
                    />
                    <span className="min-w-0 leading-tight">
                        <span className="flex items-center gap-2">
                            <span className="truncate text-[15px] font-semibold">{BRAND.name}</span>
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                Gratis
                            </span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                            Solo en este dispositivo
                        </span>
                    </span>
                </Link>
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-xl px-3"
                    onClick={() => setBackupOpen(true)}
                >
                    <DatabaseBackup className="size-4" aria-hidden="true" />
                    Respaldo
                </Button>
            </div>
            <BackupSheet open={backupOpen} onOpenChange={setBackupOpen} onInstall={() => setInstallOpen(true)} />
            <InstallSheet open={installOpen} onOpenChange={setInstallOpen} />
        </header>
    )
}
