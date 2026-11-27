"use client"

// Instalar el sitio como app: cómo se puede hacer en este dispositivo y cuándo
// vale la pena sugerirlo (solo después de haber usado una herramienta).

import { useSyncExternalStore } from "react"

/** Aviso del navegador (Chrome, Edge, Android) que permite instalar con un botón. */
interface InstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * - `button`: el navegador deja instalar desde la página.
 * - `ios`: en iPhone y iPad se hace desde el menú Compartir.
 * - `menu`: desde el menú del navegador.
 * - `installed`: ya está abierta como app.
 * - `unknown`: en el servidor, antes de saberlo.
 */
export type InstallState = "button" | "ios" | "menu" | "installed" | "unknown"

const INVITE_KEY = "el-negocio:install-invite:v1"
/** Veces que se sugiere, como máximo, y cuánto se espera entre una y otra. */
const MAX_INVITES = 2
const WAIT_MS = 14 * 24 * 60 * 60 * 1000

let promptEvent: InstallPromptEvent | null = null
let justInstalled = false
let usedTool = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

if (typeof window !== "undefined") {
    // El navegador lo avisa una sola vez y muy pronto: se guarda para cuando la persona quiera
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault()
        promptEvent = event as InstallPromptEvent
        emit()
    })
    window.addEventListener("appinstalled", () => {
        justInstalled = true
        promptEvent = null
        emit()
    })
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function installState(): InstallState {
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone || justInstalled) return "installed"
    if (promptEvent) return "button"
    // El iPad se presenta como Mac: se distingue porque tiene pantalla táctil
    const ios =
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    return ios ? "ios" : "menu"
}

function readInvites(): { count: number; last: number } {
    try {
        const saved = JSON.parse(localStorage.getItem(INVITE_KEY) ?? "{}")
        return { count: Number(saved.count) || 0, last: Number(saved.last) || 0 }
    } catch {
        return { count: 0, last: 0 }
    }
}

function inviteDue(): boolean {
    if (!usedTool) return false
    const { count, last } = readInvites()
    return count < MAX_INVITES && Date.now() - last > WAIT_MS
}

export function useInstallState(): InstallState {
    return useSyncExternalStore(subscribe, installState, () => "unknown")
}

/** Verdadero cuando ya se usó una herramienta y toca sugerir la instalación. */
export function useInviteDue(): boolean {
    return useSyncExternalStore(subscribe, inviteDue, () => false)
}

/** Llamar cuando la persona logra algo útil, p. ej. guardar su primera nota. */
export function markToolUsed() {
    usedTool = true
    emit()
}

export function recordInvite() {
    usedTool = false
    try {
        const { count } = readInvites()
        localStorage.setItem(INVITE_KEY, JSON.stringify({ count: count + 1, last: Date.now() }))
    } catch {
        // Sin almacenamiento podría sugerirse otra vez; no es crítico
    }
    emit()
}

/** Abre el diálogo de instalación del navegador, si lo ofrece. */
export async function promptInstall() {
    const event = promptEvent
    if (!event) return
    // Cada aviso sirve una sola vez
    promptEvent = null
    await event.prompt()
    await event.userChoice
    emit()
}
