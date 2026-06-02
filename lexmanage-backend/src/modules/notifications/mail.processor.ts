import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send-urgent-notification')
  async handleSendUrgentNotification(job: Job) {
    this.logger.log(`Processing urgent email job ${job.id}`);
    const { to, data } = job.data;
    await this.mailService.sendUrgentNotificationEmail(to, data);
  }
}
