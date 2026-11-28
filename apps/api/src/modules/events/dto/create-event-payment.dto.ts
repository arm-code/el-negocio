import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsPositive,
  IsUUID,
  Matches,
  Max,
} from 'class-validator';

export class CreateEventPaymentDto {
  @ApiProperty({ example: 500 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount debe ser un número con máximo 2 decimales.' },
  )
  @IsPositive({ message: 'amount debe ser mayor a 0.' })
  @Max(10_000_000)
  amount: number;

  @ApiProperty({ example: '2026-11-27' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe ser YYYY-MM-DD.' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  paymentMethodId: string;
}
