import type { DocumentKind } from '../document.constants';
import type {
  BusinessDocument,
  DocumentItem,
} from '../entities/business-document.entity';

export class DocumentResponseDto {
  id: string;
  folio: number;
  kind: DocumentKind;
  values: Record<string, string>;
  items: DocumentItem[];
  eventId: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: BusinessDocument): DocumentResponseDto {
    const dto = new DocumentResponseDto();
    dto.id = entity.id;
    dto.folio = entity.folioNumber;
    dto.kind = entity.kind;
    dto.values = entity.values;
    dto.items = entity.items;
    dto.eventId = entity.eventId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
