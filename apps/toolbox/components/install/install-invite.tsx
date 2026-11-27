"use client"

// Sugiere instalar la app en un buen momento: después de haber usado una
// herramienta y ya de vuelta en su pantalla principal, nunca a media captura.

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { InstallSheet } from "@/components/install/install-sheet"
import { recordInvite, useInstallState, useInviteDue } from "@/lib/install"
import { availableTools } from "@/lib/tools-catalog"

const DELAY_MS = 1200

export function InstallInvite() {
    const pathname = usePathname()
    const state = useInstallState()
    const due = useInviteDue()
    const [open, setOpen] = useState(false)

    const atToolHome = availableTools.some((tool) => tool.href === pathname)
    const canInvite = due && atToolHome && state !== "installed" && state !== "unknown"

    useEffect(() => {
        if (!canInvite) return
        const timer = setTimeout(() => {
            setOpen(true)
            recordInvite()
        }, DELAY_MS)
        return () => clearTimeout(timer)
    }, [canInvite])

    return <InstallSheet invite open={open} onOpenChange={setOpen} />
}
