// Qué dicen los avisos. Se leen en la pantalla bloqueada: lo justo, sin teléfonos.

export interface PushMessage {
  title: string;
  body: string;
  /** Ruta de la app que abre al tocarlo. */
  url: string;
  /** Los avisos con la misma etiqueta se reemplazan. */
  tag: string;
}

/** Lo que se necesita de algo agendado para avisar. */
export interface AgendaSnapshot {
  id: string;
  name: string;
  eventDate: string | null;
  eventTime: string | null;
  eventAddress: string | null;
  status: string;
  isActive: boolean;
}

export type AgendaChange = 'created' | 'updated' | 'cancelled' | 'restored';

const AGENDA_URL = '/tools/eventos';
const MAX_TITLE = 90;
const MAX_BODY = 180;

const cut = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

const longDate = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function dayText(date: string | null, today: string): string {
  if (!date) return 'Sin fecha';
  if (date === today) return 'Hoy';
  if (date === addDays(today, 1)) return 'Mañana';
  const text = longDate.format(new Date(`${date}T00:00:00Z`)).replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "16:30" → "4:30 p.m." */
export function timeText(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const half = hour < 12 ? 'a.m.' : 'p.m.';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${half}`;
}

/** Qué cambió que valga la pena avisar; `null` si nada. */
export function agendaChange(
  before: AgendaSnapshot | null,
  after: AgendaSnapshot,
): AgendaChange | null {
  const open = after.status === 'pending' || after.status === 'delivered';

  if (!before) return after.isActive && open ? 'created' : null;
  if (!before.isActive) return null;
  // Borrar algo que seguía pendiente es cancelarlo
  if (!after.isActive) {
    return before.status === 'pending' ? 'cancelled' : null;
  }
  if (before.status !== 'cancelled' && after.status === 'cancelled') {
    return 'cancelled';
  }
  if (before.status === 'cancelled' && open) return 'restored';

  const moved =
    before.name !== after.name ||
    before.eventDate !== after.eventDate ||
    before.eventTime !== after.eventTime ||
    before.eventAddress !== after.eventAddress;
  return open && moved ? 'updated' : null;
}

const TITLES: Record<AgendaChange, string> = {
  created: 'Se agendó',
  updated: 'Cambió',
  cancelled: 'Se canceló',
  restored: 'Volvió a la agenda',
};

export function changeMessage(
  change: AgendaChange,
  event: AgendaSnapshot,
  today: string,
  actorName?: string | null,
): PushMessage {
  const when = [
    dayText(event.eventDate, today),
    event.eventTime ? timeText(event.eventTime) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const body = [
    when,
    event.eventAddress,
    actorName ? `Lo hizo ${actorName}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    title: cut(`${TITLES[change]}: ${event.name}`, MAX_TITLE),
    body: cut(body, MAX_BODY),
    url: AGENDA_URL,
    tag: `event-${event.id}`,
  };
}

const line = (event: AgendaSnapshot) =>
  event.eventTime ? `${timeText(event.eventTime)} ${event.name}` : event.name;

/** Resumen de la mañana; `null` si no hay nada hoy ni mañana. */
export function dailyMessage(
  events: AgendaSnapshot[],
  today: string,
): PushMessage | null {
  const tomorrow = addDays(today, 1);
  const todays = events.filter((e) => e.eventDate === today);
  const tomorrows = events.filter((e) => e.eventDate === tomorrow);
  if (todays.length === 0 && tomorrows.length === 0) return null;

  const body = [
    todays.length ? `Hoy: ${todays.map(line).join('; ')}` : null,
    tomorrows.length ? `Mañana: ${tomorrows.map(line).join('; ')}` : null,
  ]
    .filter(Boolean)
    .join('. ');
  return {
    title: todays.length
      ? `Hoy tienes ${todays.length} en tu agenda`
      : `Mañana tienes ${tomorrows.length} en tu agenda`,
    body: cut(body, MAX_BODY),
    url: AGENDA_URL,
    tag: 'daily',
  };
}

export function soonMessage(
  event: AgendaSnapshot,
  minutes: number,
): PushMessage {
  const lead = minutes >= 55 ? 'En una hora' : `En ${minutes} min`;
  return {
    title: cut(`${lead}: ${event.name}`, MAX_TITLE),
    body: cut(
      [event.eventTime ? timeText(event.eventTime) : null, event.eventAddress]
        .filter(Boolean)
        .join(' · '),
      MAX_BODY,
    ),
    url: AGENDA_URL,
    tag: `event-${event.id}`,
  };
}
