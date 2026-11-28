import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesNote } from '../sales-notes/entities/sales-note.entity';
import { TransactionCategory } from '../categories/entities/transaction-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { EventPaymentsService } from './event-payments.service';
import { BusinessEvent } from './entities/business-event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessEvent,
      Transaction,
      TransactionCategory,
      SalesNote,
    ]),
    TransactionsModule,
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventPaymentsService],
  exports: [EventsService],
})
export class EventsModule {}
