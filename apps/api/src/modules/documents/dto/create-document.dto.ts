import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DOCUMENT_KINDS,
  DOCUMENT_LIMITS,
  type DocumentKind,
} from '../document.constants';
import { IsDocumentValues } from './document-values.validator';

export class DocumentItemDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsPositive()
  @Max(DOCUMENT_LIMITS.maxQuantity)
  quantity: number;

  @ApiProperty({ example: 'Silla plegable' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(DOCUMENT_LIMITS.itemDescription)
  description: string;

  @ApiProperty({
    example: 350,
    description: 'Valor de cada uno; 0 si no se indica.',
  })
  @IsNumber()
  @Min(0)
  @Max(DOCUMENT_LIMITS.maxAmount)
  unitValue: number;
}

export class CreateDocumentDto {
  @ApiProperty({ enum: DOCUMENT_KINDS })
  @IsIn(DOCUMENT_KINDS, { message: 'kind no es un formato conocido.' })
  kind: DocumentKind;

  @ApiProperty({ example: { clientName: 'Juan Pérez', amount: '1500' } })
  @IsDocumentValues()
  values: Record<string, string>;

  @ApiProperty({ type: [DocumentItemDto] })
  @IsArray()
  @ArrayMaxSize(DOCUMENT_LIMITS.items)
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  items: DocumentItemDto[];

  @ApiPropertyOptional({ description: 'Evento del que salió el documento.' })
  @IsOptional()
  @IsUUID('4', { message: 'eventId debe ser un UUID válido.' })
  eventId?: string;
}
