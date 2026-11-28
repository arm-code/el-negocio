import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { BusinessesService } from '../businesses/businesses.service';
import type { BusinessEvent } from '../events/entities/business-event.entity';
import type { SentReminder } from './entities/sent-reminder.entity';
import type { PushMessage } from './messages';
import type { NotificationsService } from './notifications.service';
import { RemindersService } from './reminders.service';

const event = (id: string, eventDate: string, eventTime: string | null) =>
  ({
    id,
    name: id,
    eventDate,
    eventTime,
    eventAddress: null,
    status: 'pending',
    isActive: true,
  }) as BusinessEvent;

function setup(events: BusinessEvent[], devices = 1) {
  const claimed = new Set<string>();
  const messages: PushMessage[] = [];
  const sent = {
    createQueryBuilder: () => {
      let key = '';
      const builder = {
        insert: () => builder,
        values: (row: { key: string }) => {
          key = row.key;
          return builder;
        },
        orIgnore: () => builder,
        returning: () => builder,
        execute: () => {
          const fresh = !claimed.has(key);
          claimed.add(key);
          return Promise.resolve({ raw: fresh ? [{ key }] : [] });
        },
      };
      return builder;
    },
    delete: () => Promise.resolve(),
  };
  const service = new RemindersService(
    {
      find: () => Promise.resolve(events),
    } as unknown as Repository<BusinessEvent>,
    sent as unknown as Repository<SentReminder>,
    {
      timeZone: 'America/Ciudad_Juarez',
      teamDevices: () => Promise.resolve(Array(devices).fill({})),
      notifyTeam: (_: string, message: PushMessage) => {
        messages.push(message);
        return Promise.resolve(devices);
      },
    } as unknown as NotificationsService,
    {
      getCurrentBusiness: () => Promise.resolve({ id: 'b' }),
    } as unknown as BusinessesService,
    { get: () => undefined } as unknown as ConfigService,
  );
  return { service, messages, claimed };
}

// En diciembre, Ciudad Juárez va 7 horas atrás de UTC
const at = (local: string) =>
  new Date(Date.parse(`2026-12-04T${local}:00Z`) + 7 * 3_600_000);

describe('RemindersService', () => {
  it('manda el resumen de la mañana una sola vez', async () => {
    const { service, messages } = setup([event('cita', '2026-12-04', null)]);
    await service.run(at('07:59'));
    expect(messages).toHaveLength(0);
    await service.run(at('08:00'));
    await service.run(at('08:01'));
    expect(messages.map((m) => m.tag)).toEqual(['daily']);
  });

  it('recuerda una hora antes, una sola vez', async () => {
    const { service, messages } = setup([
      event('entrega', '2026-12-04', '16:30'),
    ]);
    await service.run(at('15:29'));
    expect(messages).toHaveLength(0);
    await service.run(at('15:30'));
    await service.run(at('15:31'));
    expect(messages.map((m) => m.title)).toEqual(['En una hora: entrega']);
  });

  it('no recuerda lo que ya pasó', async () => {
    const { service, messages } = setup([
      event('tarde', '2026-12-04', '13:00'),
    ]);
    await service.run(at('13:30'));
    expect(messages).toHaveLength(0);
  });

  it('sin dispositivos no aparta nada', async () => {
    const { service, claimed } = setup([event('cita', '2026-12-04', null)], 0);
    await service.run(at('08:00'));
    expect(claimed.size).toBe(0);
  });
});
