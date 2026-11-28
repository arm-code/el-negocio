import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Un celular (o navegador) donde alguien del equipo quiere recibir avisos. */
@Entity({ name: 'push_subscriptions', schema: 'elnegocio' })
export class PushSubscription extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Dirección del servicio de avisos del navegador. Es secreta. */
  @Index({ unique: true })
  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'varchar', length: 120 })
  p256dh: string;

  @Column({ type: 'varchar', length: 60 })
  auth: string;
}
