import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { EndpointDto, SubscribeDto } from './dto/subscription.dto';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get('key')
  @ResponseMessage('Llave de avisos.')
  @ApiOperation({
    summary: 'Llave pública para activar avisos en el navegador.',
  })
  async key() {
    return { publicKey: await this.push.publicKey() };
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avisos activados.')
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubscribeDto,
  ) {
    await this.notifications.subscribe(user.id, dto);
    return null;
  }

  @Post('subscriptions/remove')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avisos desactivados.')
  async unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EndpointDto,
  ) {
    await this.notifications.unsubscribe(user.id, dto.endpoint);
    return null;
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Aviso de prueba enviado.')
  @ApiOperation({ summary: 'Manda un aviso a tus propios dispositivos.' })
  test(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.test(user.id);
  }
}
