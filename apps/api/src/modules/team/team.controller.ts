import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../auth/decorators/current-business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AdminOnly } from '../auth/permissions';
import { CreateMemberDto, UpdateMemberDto } from './dto/team.dto';
import { TeamService } from './team.service';

@ApiTags('Team')
@ApiBearerAuth()
@AdminOnly()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @ResponseMessage('Equipo obtenido.')
  @ApiOperation({ summary: 'Quiénes pueden entrar al negocio.' })
  list(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.team.list(businessId, user.id);
  }

  @Post()
  @ResponseMessage('Persona agregada.')
  @ApiOperation({
    summary: 'Agrega a alguien y devuelve su enlace para crear contraseña.',
  })
  add(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMemberDto,
  ) {
    return this.team.add(businessId, user.id, dto);
  }

  @Patch(':userId')
  @ResponseMessage('Cambios guardados.')
  update(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.team.update(businessId, user.id, userId, dto);
  }

  @Post(':userId/access-link')
  @ResponseMessage('Enlace creado.')
  @ApiOperation({ summary: 'Enlace nuevo; el anterior deja de servir.' })
  newAccessLink(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.team.newAccessLink(businessId, user.id, userId);
  }

  @Delete(':userId')
  @ResponseMessage('Se quitó su acceso.')
  async remove(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.team.remove(businessId, user.id, userId);
    return null;
  }
}
