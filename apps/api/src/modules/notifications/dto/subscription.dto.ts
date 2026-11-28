import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateBy,
  ValidateNested,
} from 'class-validator';
import { isPushEndpoint, MAX_ENDPOINT_LENGTH } from '../push-endpoint';

class SubscriptionKeysDto {
  @ApiProperty()
  @Matches(/^[A-Za-z0-9_-]{80,100}={0,2}$/, { message: 'p256dh no es válida.' })
  p256dh: string;

  @ApiProperty()
  @Matches(/^[A-Za-z0-9_-]{16,40}={0,2}$/, { message: 'auth no es válida.' })
  auth: string;
}

export class EndpointDto {
  @ApiProperty()
  @IsString()
  @MaxLength(MAX_ENDPOINT_LENGTH)
  endpoint: string;
}

/** Lo que entrega el navegador al activar los avisos. */
export class SubscribeDto {
  @ApiProperty()
  @ValidateBy({
    name: 'isPushEndpoint',
    validator: {
      validate: isPushEndpoint,
      defaultMessage: () =>
        'Este navegador no usa un servicio de avisos conocido.',
    },
  })
  endpoint: string;

  @ApiProperty({ type: SubscriptionKeysDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;
}
