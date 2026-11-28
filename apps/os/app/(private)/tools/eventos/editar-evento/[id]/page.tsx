import { redirect } from 'next/navigation'

// Corregir ahora se hace desde la agenda; los enlaces guardados siguen llegando.
export default function EditarEventoPage() {
  redirect('/tools/eventos')
}
