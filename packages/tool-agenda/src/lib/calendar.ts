// Archivo de calendario (.ics) para que el celular se encargue del recordatorio.

import type { AgendaEvent } from '../types'

/** En .ics estos caracteres separan campos: se escapan para que el texto no los rompa. */
const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const compact = (value: string) => value.replace(/[-:]/g, '')

function nextDay(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return compact(next.toISOString().slice(0, 10))
}

export function toCalendarFile(event: AgendaEvent): string {
  const client = [event.clientName, event.clientPhone].filter(Boolean).join(' · ')
  const details = [client, event.notes].filter(Boolean).join('\n')
  // Sin zona horaria: se toma la hora del dispositivo
  const when = event.time
    ? [`DTSTART:${compact(event.date)}T${compact(event.time)}00`, 'DURATION:PT1H']
    : [`DTSTART;VALUE=DATE:${compact(event.date)}`, `DTEND;VALUE=DATE:${nextDay(event.date)}`]

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//El Negocio//Agenda//ES',
    'BEGIN:VEVENT',
    `UID:${escape(event.id)}@el-negocio`,
    `DTSTAMP:${compact(new Date().toISOString().slice(0, 19))}Z`,
    ...when,
    `SUMMARY:${escape(event.title)}`,
    ...(event.place ? [`LOCATION:${escape(event.place)}`] : []),
    ...(details ? [`DESCRIPTION:${escape(details)}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(event.title)}`,
    // Una hora antes; si es todo el día, la tarde anterior
    `TRIGGER:${event.time ? '-PT1H' : '-PT6H'}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
