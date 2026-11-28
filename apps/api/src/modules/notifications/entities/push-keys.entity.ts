import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Las llaves con las que esta instancia firma sus avisos (una sola fila). */
@Entity({ name: 'push_keys', schema: 'elnegocio' })
export class PushKeys {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ name: 'public_key', type: 'varchar', length: 200 })
  publicKey: string;

  @Column({ name: 'private_key', type: 'varchar', length: 100 })
  privateKey: string;
}
