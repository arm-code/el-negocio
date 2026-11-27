"use client"

// Acceso permanente a la instalación, a la vista pero sin competir con las herramientas.

import { useState } from "react"
import { Smartphone } from "lucide-react"
import { Button } from "@el-negocio/ui/button"
import { InstallSheet } from "@/components/install/install-sheet"
import { useInstallState } from "@/lib/install"

export function InstallButton() {
    const state = useInstallState()
    const [open, setOpen] = useState(false)

    if (state === "installed" || state === "unknown") return null

    return (
        <>
            <Button type="button" variant="outline" className="h-11 rounded-xl px-3" onClick={() => setOpen(true)}>
                <Smartphone className="size-4" aria-hidden="true" />
                Instalar app
            </Button>
            <InstallSheet open={open} onOpenChange={setOpen} />
        </>
    )
}
