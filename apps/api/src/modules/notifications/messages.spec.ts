import {
  addDays,
  agendaChange,
  AgendaSnapshot,
  changeMessage,
  dailyMessage,
  dayText,
  soonMessage,
  timeText,
} from './messages';
import { isDailyTime, isSoon, localTime, minutesUntil } from './schedule';

const event: AgendaSnapshot = {
  id: 'abc',
  name: 'Entregar sillas',
  eventDate: '2026-12-05',
  eventTime: '16:30',
  eventAddress: 'Calle 1',
  status: 'pending',
  isActive: true,
};
const today = '2026-12-04';

describe('textos', () => {
  it('dice el día como se habla', () => {
    expect(dayText('2026-12-04', today)).toBe('Hoy');
    expect(dayText('2026-12-05', today)).toBe('Mañana');
    expect(dayText('2026-12-12', today)).toBe('Sábado 12 de diciembre');
    expect(dayText(null, today)).toBe('Sin fecha');
  });

  it('cambia de mes y de año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });

  it('usa hora de 12', () => {
    expect(timeText('00:05')).toBe('12:05 a.m.');
    expect(timeText('12:00')).toBe('12:00 p.m.');
    expect(timeText('16:30')).toBe('4:30 p.m.');
  });
});

describe('agendaChange', () => {
  const with_ = (changes: Partial<AgendaSnapshot>) => ({
    ...event,
    ...changes,
  });

  it('avisa lo nuevo, pero no lo que se anota ya hecho', () => {
    expect(agendaChange(null, event)).toBe('created');
    expect(agendaChange(null, with_({ status: 'collected' }))).toBeNull();
  });

  it('avisa si cambia la fecha, la hora, el lugar o el nombre', () => {
    for (const changes of [
      { eventDate: '2026-12-06' },
      { eventTime: null },
      { eventAddress: 'Otra' },
      { name: 'Otro' },
    ]) {
      expect(agendaChange(event, with_(changes))).toBe('updated');
    }
  });

  it('calla si no cambió nada de eso', () => {
    expect(agendaChange(event, with_({}))).toBeNull();
    expect(agendaChange(event, with_({ status: 'delivered' }))).toBeNull();
    expect(agendaChange(event, with_({ status: 'collected' }))).toBeNull();
  });

  it('avisa al cancelar, al regresar y al borrar algo pendiente', () => {
    const cancelled = with_({ status: 'cancelled' });
    expect(agendaChange(event, cancelled)).toBe('cancelled');
    expect(agendaChange(cancelled, event)).toBe('restored');
    expect(agendaChange(event, with_({ isActive: false }))).toBe('cancelled');
  });

  it('no repite el aviso al borrar algo ya cancelado', () => {
    const cancelled = with_({ status: 'cancelled' });
    expect(
      agendaChange(cancelled, { ...cancelled, isActive: false }),
    ).toBeNull();
  });
});

describe('mensajes', () => {
  it('dice qué pasó, cuándo, dónde y quién', () => {
    expect(changeMessage('created', event, today, 'María')).toEqual({
      title: 'Se agendó: Entregar sillas',
      body: 'Mañana, 4:30 p.m. · Calle 1 · Lo hizo María',
      url: '/tools/eventos',
      tag: 'event-abc',
    });
  });

  it('recorta lo muy largo', () => {
    const long = changeMessage(
      'updated',
      { ...event, name: 'x'.repeat(150), eventAddress: 'y'.repeat(255) },
      today,
    );
    expect(long.title.length).toBeLessThanOrEqual(90);
    expect(long.body.length).toBeLessThanOrEqual(180);
  });

  it('resume hoy y mañana', () => {
    const message = dailyMessage(
      [{ ...event, eventDate: today, eventTime: null, name: 'Cita' }, event],
      today,
    );
    expect(message?.title).toBe('Hoy tienes 1 en tu agenda');
    expect(message?.body).toBe('Hoy: Cita. Mañana: 4:30 p.m. Entregar sillas');
  });

  it('no manda resumen si no hay nada', () => {
    expect(
      dailyMessage([{ ...event, eventDate: '2026-12-20' }], today),
    ).toBeNull();
  });

  it('dice cuánto falta', () => {
    expect(soonMessage(event, 60).title).toBe('En una hora: Entregar sillas');
    expect(soonMessage(event, 20).title).toBe('En 20 min: Entregar sillas');
  });
});

describe('horarios', () => {
  it('convierte a la hora del negocio', () => {
    // 15:00 UTC son las 8:00 en Ciudad Juárez en invierno
    expect(
      localTime(new Date('2026-12-04T15:00:00Z'), 'America/Ciudad_Juarez'),
    ).toEqual({ date: '2026-12-04', minutes: 480 });
    expect(
      localTime(new Date('2026-12-05T03:00:00Z'), 'America/Ciudad_Juarez'),
    ).toEqual({ date: '2026-12-04', minutes: 20 * 60 });
  });

  it('manda el resumen solo por la mañana', () => {
    expect(isDailyTime({ date: today, minutes: 479 })).toBe(false);
    expect(isDailyTime({ date: today, minutes: 480 })).toBe(true);
    expect(isDailyTime({ date: today, minutes: 720 })).toBe(false);
  });

  it('cuenta lo que falta, también pasando la medianoche', () => {
    const night = { date: today, minutes: 23 * 60 + 40 };
    expect(minutesUntil(night, '2026-12-05', '00:20')).toBe(40);
    expect(isSoon(40)).toBe(true);
    expect(isSoon(61)).toBe(false);
    expect(isSoon(0)).toBe(false);
  });
});
