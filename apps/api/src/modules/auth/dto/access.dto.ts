import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  ACCESS_TOKEN_PATTERN,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../access.constants';

export class CheckAccessDto {
  @ApiProperty({ description: 'Código del enlace recibido.' })
  @IsString()
  @Matches(ACCESS_TOKEN_PATTERN, {
    message: 'Este enlace ya no sirve. Pide uno nuevo a tu administrador.',
  })
  token: string;
}

export class RedeemAccessDto extends CheckAccessDto {
  @ApiProperty({ description: 'Contraseña nueva.' })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  })
  @MaxLength(MAX_PASSWORD_LENGTH, {
    message: `La contraseña puede tener hasta ${MAX_PASSWORD_LENGTH} caracteres.`,
  })
  password: string;
}
