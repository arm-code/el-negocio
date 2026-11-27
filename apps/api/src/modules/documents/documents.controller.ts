import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../auth/decorators/current-business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

/** Contratos y pagarés del negocio. */
@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ResponseMessage('Documento creado exitosamente.')
  @ApiOperation({ summary: 'Crear un documento; recibe el siguiente folio.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(businessId, user.id, dto);
  }

  @Get()
  @ResponseMessage('Documentos obtenidos exitosamente.')
  @ApiOperation({ summary: 'Listar los documentos del negocio.' })
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.documentsService.findAll(businessId, query);
  }

  @Get(':id')
  @ResponseMessage('Documento obtenido exitosamente.')
  findOne(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ResponseMessage('Documento actualizado exitosamente.')
  update(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Documento borrado exitosamente.')
  remove(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.remove(businessId, id);
  }
}
