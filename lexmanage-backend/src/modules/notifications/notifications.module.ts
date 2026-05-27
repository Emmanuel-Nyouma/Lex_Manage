import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RemindersService } from './reminders.service';

@Module({
  providers: [NotificationsService, RemindersService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
