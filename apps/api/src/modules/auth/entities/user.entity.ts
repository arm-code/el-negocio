import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Usuarios del sistema (reemplaza a `auth.users` de Supabase).
 * El email se guarda siempre en minúsculas.
 */
@Entity({ name: 'users', schema: 'elnegocio' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /** Hash bcrypt. `null` = el usuario aún no puede iniciar sesión. */
  @Column({ name: 'password_hash', type: 'varchar', length: 100, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Como se le saluda; la cuenta creada por comando puede no tenerlo. */
  @Column({ type: 'varchar', length: 150, nullable: true })
  name: string | null;

  /** Las sesiones anteriores a esta fecha dejan de valer. */
  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;
}
