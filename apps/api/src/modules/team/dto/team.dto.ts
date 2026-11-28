import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { BusinessRole } from '../../businesses/enums/business-role.enum';

/** Los tipos que se pueden dar desde la app: administrador o empleado. */
export const TEAM_ROLES = [BusinessRole.ADMIN, BusinessRole.EDITOR] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMemberDto {
  @ApiProperty({ example: 'María Pérez' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribe el nombre.' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'maria@mi-negocio.mx' })
  @Transform(trim)
  @IsEmail({}, { message: 'Escribe un correo válido.' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ enum: TEAM_ROLES })
  @IsIn(TEAM_ROLES)
  role: BusinessRole;
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @Transform(trim)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Escribe el nombre.' })
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: TEAM_ROLES })
  @IsOptional()
  @IsIn(TEAM_ROLES)
  role?: BusinessRole;
}
