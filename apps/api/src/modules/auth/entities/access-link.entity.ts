import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Enlace de un solo uso para que alguien del equipo cree (o recupere) su contraseña.
 * Solo se guarda el hash: con la base no se puede reconstruir un enlace.
 */
@Entity({ name: 'user_access_links', schema: 'elnegocio' })
export class AccessLink extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;
}
