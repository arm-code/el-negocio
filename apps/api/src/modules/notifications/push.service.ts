// Envío de avisos con el estándar Web Push: sin cuentas ni cobros. Cada navegador tiene
// su servicio de entrega y los mensajes viajan cifrados.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushKeys } from './entities/push-keys.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import type { PushMessage } from './messages';

/** Si el celular está apagado, el aviso se entrega hasta 12 horas después. */
const TTL_SECONDS = 12 * 60 * 60;
const TIMEOUT_MS = 10_000;
/** Los servicios exigen una forma de identificar a quien envía. */
const DEFAULT_SUBJECT = 'https://github.com/arm-code/el-negocio';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private cached: Promise<PushKeys> | null = null;

  constructor(
    @InjectRepository(PushKeys)
    private readonly keyRepository: Repository<PushKeys>,
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
    private readonly config: ConfigService,
  ) {}

  async publicKey(): Promise<string> {
    return (await this.keys()).publicKey;
  }

  /** Manda el mensaje a cada dispositivo; devuelve a cuántos se entregó. */
  async send(
    targets: PushSubscription[],
    message: PushMessage,
  ): Promise<number> {
    if (targets.length === 0) return 0;
    const { publicKey, privateKey } = await this.keys();
    const payload = JSON.stringify(message);

    const results = await Promise.all(
      targets.map(async ({ id, endpoint, p256dh, auth }) => {
        try {
          await webpush.sendNotification(
            { endpoint, keys: { p256dh, auth } },
            payload,
            {
              vapidDetails: { subject: this.subject(), publicKey, privateKey },
              TTL: TTL_SECONDS,
              urgency: 'high',
              timeout: TIMEOUT_MS,
            },
          );
          return true;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          // Ese dispositivo ya no existe: se olvida
          if (status === 404 || status === 410) {
            await this.subscriptions.delete({ id });
          } else {
            // Sin la dirección: es secreta
            this.logger.warn(
              `Aviso no entregado (${status ?? (error as Error).message})`,
            );
          }
          return false;
        }
      }),
    );
    return results.filter(Boolean).length;
  }

  private subject(): string {
    const value = this.config.get<string>('VAPID_SUBJECT')?.trim();
    return value && /^(https:\/\/|mailto:)/.test(value)
      ? value
      : DEFAULT_SUBJECT;
  }

  /** Las llaves se crean solas la primera vez: no hay nada que configurar. */
  private keys(): Promise<PushKeys> {
    this.cached ??= this.loadKeys().catch((error: unknown) => {
      this.cached = null;
      throw error;
    });
    return this.cached;
  }

  private async loadKeys(): Promise<PushKeys> {
    const saved = await this.keyRepository.findOneBy({ id: 1 });
    if (saved) return saved;
    await this.keyRepository
      .createQueryBuilder()
      .insert()
      .values({ id: 1, ...webpush.generateVAPIDKeys() })
      // Si otro proceso las creó al mismo tiempo, valen las suyas
      .orIgnore()
      .execute();
    return this.keyRepository.findOneByOrFail({ id: 1 });
  }
}
