'use client'

// Lo agendado, con lo que se puede hacer con ello. Solo muestra lo que se llenó.

import type { ReactNode } from 'react'
import { CalendarPlus, Check, MapPin, MessageCircle, PackageCheck, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppBottomSheet } from '@el-negocio/ui/app-bottom-sheet'
import { Button } from '@el-negocio/ui/button'
import { ContactButtons, DetailSection, TOUCH } from '@el-negocio/ui/detail'
import { formatMxPhone, toMxPhone, toSlug } from '@el-negocio/ui/display'
import { cn } from '@el-negocio/ui/utils'
import { toCalendarFile } from '../lib/calendar'
import { dayFromToday, dayName, tabOf, timeName } from '../lib/when'
import type { AgendaEvent, EventStatus } from '../types'
import { ChargeSection } from './charge-section'

/** Abre el archivo de calendario: el celular ofrece guardarlo con su recordatorio. */
function addToCalendar(event: AgendaEvent) {
  try {
    const url = URL.createObjectURL(new Blob([toCalendarFile(event)], { type: 'text/calendar;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${toSlug(event.title, 'evento')}.ics`
    link.addEventListener('click', (e) => e.stopPropagation())
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Algunos navegadores leen el archivo después del clic
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    toast.success('Ábrelo para guardarlo en tu calendario')
  } catch {
    toast.error('No se pudo preparar el calendario')
  }
}

/** Mensaje de WhatsApp para recordarle la cita al cliente. */
function reminder(event: AgendaEvent) {
  const day = dayName(event.date).toLowerCase()
  // "hoy", "mañana", "el sábado 5 de diciembre"
  const when = day === 'hoy' || day === 'mañana' ? day : `el ${day}`
  return [
    `Hola${event.clientName ? ` ${event.clientName}` : ''}, te recuerdo: ${event.title}`,
    `, ${when}`,
    event.time ? ` a las ${timeName(event.time)}` : '',
    event.place ? `, en ${event.place}` : '',
    '.',
  ].join('')
}

/** El siguiente paso: lo que más se hace desde aquí, en el botón grande. */
function nextStep({ status, needsReturn }: AgendaEvent) {
  if (status === 'pending' && needsReturn) {
    return { status: 'delivered' as const, label: 'Marcar como entregado', icon: PackageCheck }
  }
  if (status === 'delivered' && needsReturn) {
    return { status: 'done' as const, label: 'Ya lo devolvieron', icon: Check }
  }
  if (status === 'pending' || status === 'delivered') {
    return { status: 'done' as const, label: 'Marcar como hecho', icon: Check }
  }
  return { status: 'pending' as const, label: 'Volver a pendiente', icon: RotateCcw }
}

const STATUS_NOTE: Partial<Record<EventStatus, { text: string; className: string }>> = {
  delivered: { text: 'Entregado', className: 'text-primary' },
  done: { text: 'Hecho', className: 'text-success' },
  cancelled: { text: 'Cancelado', className: 'text-destructive' },
}

interface EventDetailProps {
  event: AgendaEvent | null
  isChanging: boolean
  onClose: () => void
  onEdit: (event: AgendaEvent) => void
  onStatus: (event: AgendaEvent, status: EventStatus) => void
  onDelete: (event: AgendaEvent) => void
  /** Secciones propias de la aplicación, p. ej. documentos de lo agendado. */
  renderExtra?: (event: AgendaEvent) => ReactNode
}

export function EventDetail({
  event,
  isChanging,
  onClose,
  onEdit,
  onStatus,
  onDelete,
  renderExtra,
}: EventDetailProps) {
  const phone = event ? toMxPhone(event.clientPhone) : null
  const open = event ? tabOf(event) === 'pending' : false
  const next = event ? nextStep(event) : null
  const note = event ? STATUS_NOTE[event.status] : undefined
  const showCharge = event ? event.total !== undefined || event.paid > 0 : false

  return (
    <AppBottomSheet
      open={event !== null}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={event?.title ?? ''}
      headerAction={
        event && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Corregir"
            onClick={() => onEdit(event)}
          >
            <Pencil className="size-5" aria-hidden="true" />
          </Button>
        )
      }
      footer={
        event &&
        next && (
          <Button
            variant={open ? 'default' : 'outline'}
            className={cn(TOUCH, 'w-full text-base')}
            disabled={isChanging}
            onClick={() => onStatus(event, next.status)}
          >
            <next.icon aria-hidden="true" />
            {next.label}
          </Button>
        )
      }
    >
      {event && (
        <div className="space-y-6">
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-lg font-semibold">{dayName(event.date)}</p>
            {event.time && <p className="text-base text-muted-foreground">{timeName(event.time)}</p>}
            {note && (
              <p className={cn('mt-1 text-sm font-medium', note.className)}>
                {note.text}
                {event.status === 'delivered' && event.needsReturn && ' · falta que lo devuelvan'}
              </p>
            )}
            {event.folio && <p className="mt-1 text-sm text-muted-foreground">{event.folio}</p>}
          </div>

          {(event.clientName || event.clientPhone) && (
            <DetailSection title="Cliente">
              <div>
                {event.clientName && <p className="text-base font-medium">{event.clientName}</p>}
                {event.clientPhone && (
                  <p className="text-[15px] tabular-nums text-muted-foreground">
                    {phone ? formatMxPhone(phone) : event.clientPhone}
                  </p>
                )}
              </div>
              {phone && <ContactButtons phone={phone} />}
              {phone && event.status === 'pending' && event.date >= dayFromToday(0) && (
                <Button asChild variant="ghost" className={cn(TOUCH, 'w-full text-primary')}>
                  <a
                    href={`https://wa.me/52${phone}?text=${encodeURIComponent(reminder(event))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden="true" />
                    Mandarle un recordatorio
                  </a>
                </Button>
              )}
            </DetailSection>
          )}

          {event.place && (
            <DetailSection title="Lugar">
              <p className="text-pretty text-base leading-relaxed">{event.place}</p>
              <Button asChild variant="outline" className={cn(TOUCH, 'w-full')}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin aria-hidden="true" />
                  Ver en el mapa
                </a>
              </Button>
            </DetailSection>
          )}

          {showCharge && <ChargeSection key={event.id} event={event} />}

          {event.guarantee && (
            <DetailSection title="Garantía">
              <p className="text-pretty text-base leading-relaxed">{event.guarantee}</p>
            </DetailSection>
          )}

          {event.notes && (
            <DetailSection title="Notas">
              <p className="whitespace-pre-line text-pretty text-base leading-relaxed">{event.notes}</p>
            </DetailSection>
          )}

          {renderExtra?.(event)}

          <div className="space-y-1 border-t pt-4">
            {event.status === 'pending' && (
              <Button variant="outline" className={cn(TOUCH, 'w-full')} onClick={() => addToCalendar(event)}>
                <CalendarPlus aria-hidden="true" />
                Agregar a mi calendario
              </Button>
            )}
            {event.status === 'delivered' && (
              <Button
                variant="ghost"
                className={cn(TOUCH, 'w-full text-muted-foreground')}
                disabled={isChanging}
                onClick={() => onStatus(event, 'pending')}
              >
                <RotateCcw aria-hidden="true" />
                Volver a pendiente
              </Button>
            )}
            {event.status === 'cancelled' ? (
              <Button
                variant="ghost"
                className={cn(TOUCH, 'w-full text-destructive hover:bg-destructive/10 hover:text-destructive')}
                onClick={() => onDelete(event)}
              >
                <Trash2 aria-hidden="true" />
                Borrar
              </Button>
            ) : (
              <Button
                variant="ghost"
                className={cn(TOUCH, 'w-full text-destructive hover:bg-destructive/10 hover:text-destructive')}
                disabled={isChanging}
                onClick={() => onStatus(event, 'cancelled')}
              >
                {/* "Cancelar" a secas se confunde con cerrar la ventana */}
                Marcar como cancelado
              </Button>
            )}
          </div>
        </div>
      )}
    </AppBottomSheet>
  )
}
