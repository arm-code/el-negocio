import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { BusinessUser } from '../businesses/entities/business-user.entity';
import { SubscribeDto } from './dto/subscription.dto';
import { PushSubscription } from './entities/push-subscription.entity';
import {
  agendaChange,
  AgendaSnapshot,
  changeMessage,
  PushMessage,
} from './messages';
import { PushService } from './push.service';
import { DEFAULT_TIME_ZONE, localTime } from './schedule';

/** Dispositivos por persona; al pasar el tope se olvida el más viejo. */
const MAX_DEVICES = 10;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  readonly timeZone: string;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
    @InjectRepository(BusinessUser)
    private readonly members: Repository<BusinessUser>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly push: PushService,
    config: ConfigService,
  ) {
    this.timeZone = this.validTimeZone(config.get<string>('BUSINESS_TZ'));
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    // Un dispositivo es de quien lo activó al final (celular compartido)
    await this.subscriptions.upsert(
      {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
      ['endpoint'],
    );
    const old = await this.subscriptions.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip: MAX_DEVICES,
    });
    if (old.length) await this.subscriptions.remove(old);
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.subscriptions.delete({ userId, endpoint });
  }

  /** Aviso de prueba, solo a los dispositivos de quien lo pide. */
  async test(userId: string) {
    const mine = await this.subscriptions.findBy({ userId });
    const sent = await this.push.send(mine, {
      title: 'Así te van a llegar los avisos',
      body: 'Te avisaremos lo que se agende y lo que ya viene.',
      url: '/avisos',
      tag: 'test',
    });
    return { sent, devices: mine.length };
  }

  /** A todo el equipo, menos a quien hizo el cambio. */
  async notifyTeam(
    businessId: string,
    message: PushMessage,
    exceptUserId?: string,
  ): Promise<number> {
    return this.push.send(
      await this.teamDevices(businessId, exceptUserId),
      message,
    );
  }

  async teamDevices(businessId: string, exceptUserId?: string) {
    const members = await this.members.findBy({ businessId });
    const ids = members
      .map((m) => m.userId)
      .filter((id) => id !== exceptUserId);
    if (ids.length === 0) return [];
    const active = await this.users.findBy({ id: In(ids), isActive: true });
    if (active.length === 0) return [];
    return this.subscriptions.findBy({ userId: In(active.map((u) => u.id)) });
  }

  /**
   * Avisa un cambio en la agenda. No se espera ni falla: guardar lo agendado no
   * depende de que el aviso salga.
   */
  agendaChanged(
    businessId: string,
    actorId: string,
    before: AgendaSnapshot | null,
    after: AgendaSnapshot,
  ): void {
    const change = agendaChange(before, after);
    if (!change) return;

    void (async () => {
      const devices = await this.teamDevices(businessId, actorId);
      if (devices.length === 0) return;
      const actor = await this.users.findOneBy({ id: actorId });
      const today = localTime(new Date(), this.timeZone).date;
      await this.push.send(
        devices,
        changeMessage(change, after, today, actor?.name),
      );
    })().catch((error: unknown) => {
      this.logger.warn(`No se pudo avisar: ${(error as Error).message}`);
    });
  }

  private validTimeZone(value?: string): string {
    const timeZone = value?.trim() || DEFAULT_TIME_ZONE;
    try {
      new Intl.DateTimeFormat('es-MX', { timeZone });
      return timeZone;
    } catch {
      this.logger.warn(
        `BUSINESS_TZ="${timeZone}" no existe; se usa ${DEFAULT_TIME_ZONE}.`,
      );
      return DEFAULT_TIME_ZONE;
    }
  }
}
