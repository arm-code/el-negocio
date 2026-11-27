import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { DocumentKind } from '../document.constants';

export interface DocumentItem {
  quantity: number;
  description: string;
  unitValue: number;
}

/** Un contrato o pagaré hecho por el negocio. */
@Entity({ name: 'business_documents', schema: 'elnegocio' })
@Index(['businessId', 'folioNumber'], { unique: true })
export class BusinessDocument extends BaseEntity {
  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  /** Quién lo hizo. */
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  /** Consecutivo del negocio; no se vuelve a usar aunque se borre. */
  @Column({ name: 'folio_number', type: 'integer' })
  folioNumber: number;

  @Column({ type: 'varchar', length: 30 })
  kind: DocumentKind;

  @Column({ type: 'jsonb', default: {} })
  values: Record<string, string>;

  @Column({ type: 'jsonb', default: [] })
  items: DocumentItem[];

  @Index()
  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  eventId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
