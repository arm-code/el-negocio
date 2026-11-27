import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { sortColumn } from '../../common/utils/sort-column';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { BusinessDocument } from './entities/business-document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(BusinessDocument)
    private readonly documentRepository: Repository<BusinessDocument>,
    @InjectRepository(BusinessEvent)
    private readonly eventRepository: Repository<BusinessEvent>,
  ) {}

  async create(
    businessId: string,
    userId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    if (dto.eventId) {
      const exists = await this.eventRepository.existsBy({
        id: dto.eventId,
        businessId,
      });
      if (!exists) {
        throw new BadRequestException('No se encontró lo agendado.');
      }
    }

    const saved = await this.documentRepository.manager.transaction(
      async (manager) => {
        // Un documento a la vez por negocio: así no se repite el folio
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          `documents:${businessId}`,
        ]);
        const repository = manager.getRepository(BusinessDocument);
        // Cuentan también los borrados: su folio no se vuelve a usar
        const last = await repository.maximum('folioNumber', { businessId });
        return repository.save(
          repository.create({
            businessId,
            ownerId: userId,
            folioNumber: (last ?? 0) + 1,
            kind: dto.kind,
            values: dto.values,
            items: dto.items.map((item) => ({ ...item })),
            eventId: dto.eventId ?? null,
            isActive: true,
          }),
        );
      },
    );

    return DocumentResponseDto.fromEntity(saved);
  }

  async findAll(businessId: string, query: PaginationQueryDto) {
    const sortBy = sortColumn(query.sortBy, [
      'createdAt',
      'updatedAt',
      'id',
      'folioNumber',
    ]);
    const [items, total] = await this.documentRepository.findAndCount({
      where: { businessId, isActive: true },
      order: { [sortBy]: query.sortOrder },
      skip: query.skip,
      take: query.limit,
    });

    return new PaginatedResultDto(
      items.map((item) => DocumentResponseDto.fromEntity(item)),
      query.page,
      query.limit,
      total,
    );
  }

  async findOne(businessId: string, id: string): Promise<DocumentResponseDto> {
    return DocumentResponseDto.fromEntity(
      await this.getEntityOrFail(businessId, id),
    );
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const entity = await this.getEntityOrFail(businessId, id);
    entity.kind = dto.kind;
    entity.values = dto.values;
    entity.items = dto.items.map((item) => ({ ...item }));
    return DocumentResponseDto.fromEntity(
      await this.documentRepository.save(entity),
    );
  }

  /** Se oculta: el registro y su folio se conservan. */
  async remove(businessId: string, id: string): Promise<void> {
    const entity = await this.getEntityOrFail(businessId, id);
    entity.isActive = false;
    await this.documentRepository.save(entity);
  }

  private async getEntityOrFail(
    businessId: string,
    id: string,
  ): Promise<BusinessDocument> {
    const entity = await this.documentRepository.findOne({
      where: { id, businessId, isActive: true },
    });
    if (!entity) {
      throw new NotFoundException('No se encontró el documento.');
    }
    return entity;
  }
}
