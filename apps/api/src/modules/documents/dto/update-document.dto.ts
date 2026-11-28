import { OmitType } from '@nestjs/swagger';
import { CreateDocumentDto } from './create-document.dto';

/**
 * Se reemplaza todo lo capturado. El folio y el evento del que salió no cambian.
 */
export class UpdateDocumentDto extends OmitType(CreateDocumentDto, [
  'eventId',
] as const) {}
