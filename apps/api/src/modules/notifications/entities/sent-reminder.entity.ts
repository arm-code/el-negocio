import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Recordatorios ya mandados: así no se repiten, tampoco al reiniciar el API. */
@Entity({ name: 'sent_reminders', schema: 'elnegocio' })
export class SentReminder {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  key: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
