// Lo cobrado de algo agendado. Cada cobro es una entrada de Caja, pero quien cobra no
// necesita (ni debe) ver la Caja: por eso se anota y se consulta desde la agenda.

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { TransactionCategory } from '../categories/entities/transaction-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateEventPaymentDto } from './dto/create-event-payment.dto';
import { BusinessEvent } from './entities/business-event.entity';
import { paymentCategory } from './payment-category';

export interface EventPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
}

const toPayment = (t: {
  id: string;
  amount: number | string;
  transactionDate: string;
  paymentMethod: { name: string };
}): EventPayment => ({
  id: t.id,
  amount: Number(t.amount),
  date: t.transactionDate.slice(0, 10),
  method: t.paymentMethod.name,
});

@Injectable()
export class EventPaymentsService {
  constructor(
    @InjectRepository(BusinessEvent)
    private readonly events: Repository<BusinessEvent>,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
    @InjectRepository(TransactionCategory)
    private readonly categories: Repository<TransactionCategory>,
    private readonly cash: TransactionsService,
  ) {}

  async list(businessId: string, eventId: string): Promise<EventPayment[]> {
    await this.eventOrFail(businessId, eventId);
    const movements = await this.transactions.find({
      where: {
        businessId,
        businessEvent: { id: eventId },
        type: TransactionType.INPUT,
      },
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });
    return movements.map(toPayment);
  }

  async create(
    businessId: string,
    userId: string,
    eventId: string,
    dto: CreateEventPaymentDto,
  ): Promise<EventPayment> {
    const event = await this.eventOrFail(businessId, eventId);
    const category = paymentCategory(
      await this.categories.find({
        where: { businessId, isActive: true },
        order: { name: 'ASC' },
      }),
      event.needsReturn,
    );
    if (!category) {
      throw new BadRequestException(
        'No hay categorías para anotar el cobro. Pide a tu administrador que agregue una.',
      );
    }

    const saved = await this.cash.create(businessId, userId, {
      type: TransactionType.INPUT,
      amount: dto.amount,
      transactionDate: dto.date,
      paymentMethodId: dto.paymentMethodId,
      categoryId: category.id,
      businessEventId: event.id,
      description: [event.name, event.clientName]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 255),
    });
    return toPayment(saved);
  }

  private async eventOrFail(businessId: string, id: string) {
    const event = await this.events.findOne({
      where: { id, businessId, isActive: true },
    });
    if (!event) {
      throw new NotFoundException(`No se encontró el evento con id "${id}".`);
    }
    return event;
  }
}
