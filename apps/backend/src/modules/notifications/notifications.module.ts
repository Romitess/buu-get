import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { FundSourcesModule } from '../fund-sources/fund-sources.module';
import { Notification } from './entities/notification.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationRecipient, User]),
    FundSourcesModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
