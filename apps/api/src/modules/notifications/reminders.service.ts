// Recordatorios de la agenda. El API revisa cada minuto; cada recordatorio se aparta en
// la base antes de mandarlo, así sale una sola vez.

import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { BusinessesService } from '../businesses/businesses.service';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { EventStatus } from '../events/enums/event-status.enum';
import { SentReminder } from './entities/sent-reminder.entity';
import { addDays, dailyMessage, soonMessage } from './messages';
import { NotificationsService } from './notifications.service';
import { isDailyTime, isSoon, localTime, minutesUntil } from './schedule';

const EVERY_MS = 60_000;
const KEEP_MS = 60 * 24 * 60 * 60 * 1000;

@Injectable()
export class RemindersService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RemindersService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @InjectRepository(BusinessEvent)
    private readonly events: Repository<BusinessEvent>,
    @InjectRepository(SentReminder)
    private readonly sent: Repository<SentReminder>,
    private readonly notifications: NotificationsService,
    private readonly businesses: BusinessesService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get<string>('REMINDERS') === 'off') return;
    this.timer = setInterval(() => void this.run(), EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run(instant = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.check(instant);
    } catch (error) {
      this.logger.warn(
        `No se pudieron revisar los recordatorios: ${(error as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }

  private async check(instant: Date) {
    const { id: businessId } = await this.businesses.getCurrentBusiness();
    // Sin ningún dispositivo no hay nada que apartar
    const devices = await this.notifications.teamDevices(businessId);
    if (devices.length === 0) return;

    const now = localTime(instant, this.notifications.timeZone);
    const upcoming = await this.events.find({
      where: {
        businessId,
        isActive: true,
        status: EventStatus.PENDING,
        eventDate: In([now.date, addDays(now.date, 1)]),
      },
      order: { eventDate: 'ASC', eventTime: 'ASC' },
    });

    if (isDailyTime(now) && (await this.claim(`daily:${now.date}`))) {
      const message = dailyMessage(upcoming, now.date);
      if (message) {
        await this.notifications.notifyTeam(businessId, message);
      }
      await this.sent.delete({
        createdAt: LessThan(new Date(instant.getTime() - KEEP_MS)),
      });
    }

    for (const event of upcoming) {
      if (!event.eventDate || !event.eventTime) continue;
      const minutes = minutesUntil(now, event.eventDate, event.eventTime);
      // La llave lleva fecha y hora: si lo cambian, se vuelve a recordar
      const key = `soon:${event.id}:${event.eventDate}:${event.eventTime}`;
      if (isSoon(minutes) && (await this.claim(key))) {
        await this.notifications.notifyTeam(
          businessId,
          soonMessage(event, minutes),
        );
      }
    }
  }

  /** Aparta un recordatorio; `false` si ya se había mandado. */
  private async claim(key: string): Promise<boolean> {
    const result = await this.sent
      .createQueryBuilder()
      .insert()
      .values({ key })
      .orIgnore()
      .returning('key')
      .execute();
    return (result.raw as unknown[]).length > 0;
  }
}
