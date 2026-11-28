// Avisos en este celular (estándar Web Push). Aquí solo se habla con el navegador y con
// el API; qué se avisa y cuándo lo decide el API.

import { axiosInstance } from '@/lib/api/axios'

const PATH = '/v1/notifications'

export type PushState =
  /** El navegador no sabe recibir avisos. */
  | 'unsupported'
  /** En iPhone solo funcionan con la app agregada a la pantalla de inicio. */
  | 'ios-install'
  /** La persona los bloqueó: solo se reactivan en los ajustes del navegador. */
  | 'denied'
  | 'off'
  | 'on'

function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function isUninstalledIos() {
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // El iPad se presenta como Mac, pero es táctil
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !installed
}

async function registration() {
  await navigator.serviceWorker.register('/sw.js')
  return navigator.serviceWorker.ready
}

async function currentSubscription() {
  return (await registration()).pushManager.getSubscription()
}

function toBytes(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const text = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(text, (char) => char.charCodeAt(0))
}

/** Si la suscripción se hizo con otra llave (p. ej. base nueva), ya no sirve. */
function sameKey(subscription: PushSubscription, key: Uint8Array) {
  const used = subscription.options.applicationServerKey
  if (!used) return false
  const bytes = new Uint8Array(used)
  return bytes.length === key.length && bytes.every((byte, i) => byte === key[i])
}

async function publicKey() {
  const { data } = await axiosInstance.get<{ publicKey: string }>(`${PATH}/key`)
  return toBytes(data.publicKey)
}

/** Suscribe este navegador (o reutiliza la suscripción) y lo registra en el API. */
async function register() {
  const worker = await registration()
  const key = await publicKey()
  let subscription = await worker.pushManager.getSubscription()
  if (subscription && !sameKey(subscription, key)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  const { endpoint, keys } = subscription.toJSON()
  await axiosInstance.post(`${PATH}/subscriptions`, { endpoint, keys })
}

export async function pushState(): Promise<PushState> {
  if (!isSupported()) return isUninstalledIos() ? 'ios-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  return (await currentSubscription()) ? 'on' : 'off'
}

export async function enablePush() {
  // Lo primero: iPhone solo deja pedir el permiso justo al tocar el botón
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Para recibir avisos hay que permitirlos en este celular.')
  }
  await register()
}

export async function disablePush() {
  const subscription = await currentSubscription()
  if (!subscription) return
  const { endpoint } = subscription
  await subscription.unsubscribe()
  await axiosInstance.post(`${PATH}/subscriptions/remove`, { endpoint })
}

/** Al entrar: si este celular ya tenía avisos, quedan a nombre de quien entró. */
export async function syncPush() {
  if (!isSupported() || Notification.permission !== 'granted') return
  if (await currentSubscription()) await register()
}

/** Al cerrar sesión a propósito, este celular deja de recibir. Nunca bloquea la salida. */
export async function forgetDevice() {
  if (!isSupported() || Notification.permission !== 'granted') return
  await Promise.race([disablePush(), new Promise((resolve) => setTimeout(resolve, 3000))]).catch(() => {})
}

export async function testPush() {
  const { data } = await axiosInstance.post<{ sent: number; devices: number }>(`${PATH}/test`)
  return data
}
