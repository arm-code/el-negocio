// Cuándo toca cada recordatorio, siempre en la hora del negocio (el servidor va en UTC).

export const DEFAULT_TIME_ZONE = 'America/Ciudad_Juarez';

/** El resumen sale desde las 8:00; después del mediodía ya no tiene caso. */
export const DAILY_FROM = 8 * 60;
export const DAILY_UNTIL = 12 * 60;
export const SOON_MINUTES = 60;

export interface LocalTime {
  date: string;
  /** Minutos desde la medianoche. */
  minutes: number;
}

export function localTime(instant: Date, timeZone: string): LocalTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export const isDailyTime = ({ minutes }: LocalTime) =>
  minutes >= DAILY_FROM && minutes < DAILY_UNTIL;

const dayNumber = (date: string) =>
  Date.parse(`${date}T00:00:00Z`) / 86_400_000;

/** Cuántos minutos faltan para algo con fecha y hora. */
export function minutesUntil(now: LocalTime, date: string, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return (
    (dayNumber(date) - dayNumber(now.date)) * 1440 +
    hour * 60 +
    minute -
    now.minutes
  );
}

export const isSoon = (minutes: number) =>
  minutes > 0 && minutes <= SOON_MINUTES;
