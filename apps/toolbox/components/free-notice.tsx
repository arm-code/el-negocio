"use client"

// Aviso de la primera vez que alguien entra a una micro app: evita que se confunda
// con el panel de administración de un negocio.

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@el-negocio/ui/alert-dialog"
import { useHasMounted } from "@/hooks/useHasMounted"
import { BRAND } from "@/lib/brand"

const STORAGE_KEY = "el-negocio:free-notice:v1"

function alreadyAccepted() {
    try {
        return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
        return false
    }
}

export function FreeNotice() {
    const hasMounted = useHasMounted()
    const [accepted, setAccepted] = useState(false)

    if (!hasMounted || accepted || alreadyAccepted()) return null

    const accept = () => {
        setAccepted(true)
        try {
            localStorage.setItem(STORAGE_KEY, "1")
        } catch {
            // Sin almacenamiento el aviso volverá a salir; no es crítico
        }
    }

    return (
        <AlertDialog open>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Herramientas gratuitas de {BRAND.name}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-pretty">
                            <p>
                                <strong className="text-foreground">
                                    Esto no es el panel de administración de tu negocio.
                                </strong>{" "}
                                Lo que captures aquí se guarda solo en este dispositivo y no llega a ningún
                                sistema.
                            </p>
                            <p>Si tu negocio tiene su propio panel, entra con la dirección de tu negocio.</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction className="h-12 rounded-xl text-base" onClick={accept}>
                        Entendido, usar gratis
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
