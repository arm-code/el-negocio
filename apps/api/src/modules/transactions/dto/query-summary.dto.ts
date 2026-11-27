import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

/** Rango opcional del resumen. Sin fechas suma todo el historial. */
export class QuerySummaryDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial del rango (inclusive), YYYY-MM-DD.',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'dateFrom debe ser una fecha válida (YYYY-MM-DD).' })
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango (inclusive), YYYY-MM-DD.',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'dateTo debe ser una fecha válida (YYYY-MM-DD).' })
  dateTo?: string;
}
