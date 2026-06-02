import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RemindersService } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { CleanupService } from './cleanup.service';
import { MailModule } from '../mail/mail.module';
import { MailProcessor } from './mail.processor';
import { EventsModule } from '../events/events.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'mail' }, { name: 'reminders' }),
    MailModule,
    EventsModule,
    DocumentsModule,
  ],
  providers: [NotificationsService, RemindersService, CleanupService, MailProcessor, RemindersProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
