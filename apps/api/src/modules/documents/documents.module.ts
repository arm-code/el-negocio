import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { BusinessDocument } from './entities/business-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessDocument, BusinessEvent])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
