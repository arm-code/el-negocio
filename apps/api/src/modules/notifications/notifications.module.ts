import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { BusinessUser } from '../businesses/entities/business-user.entity';
import { BusinessEvent } from '../events/entities/business-event.entity';
import { PushKeys } from './entities/push-keys.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { SentReminder } from './entities/sent-reminder.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushKeys,
      PushSubscription,
      SentReminder,
      BusinessUser,
      BusinessEvent,
      User,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [PushService, NotificationsService, RemindersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
