import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationLevel, NotificationMotif } from '@prisma/client';

@Processor('reminders')
export class RemindersProcessor {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('send-reminder')
  async handleSendReminder(job: Job) {
    this.logger.log(`Processing reminder job ${job.id}`);
    const { deadlineId, tenantId } = job.data;

    const deadline = await this.prisma.deadline.findUnique({
      where: { id: deadlineId },
      include: { case: { select: { title: true, assigneeId: true } } },
    });
    if (!deadline || deadline.isDone) return;

    const targetUserId = deadline.case?.assigneeId;
    if (targetUserId) {
      await this.notificationsService.create({
        title: '⏳ Échéance Imminente',
        message: `Le délai "${deadline.title}" pour le dossier "${deadline.case.title}" arrive à échéance le ${deadline.dueAt.toLocaleDateString()}.`,
        level:  deadline.priority === 'URGENT' ? NotificationLevel.URGENT : NotificationLevel.IMPORTANT,
        motif:  NotificationMotif.DEADLINE,
        recipientIds: [targetUserId],
      }, tenantId, 'SYSTEM');
      this.logger.log(`Reminder sent to user ${targetUserId}`);
    }
  }

  @Process('send-scheduled-notification')
  async handleScheduledNotification(job: Job) {
    this.logger.log(`Processing scheduled notification job ${job.id}`);
    const { scheduledNotifId, tenantId } = job.data;

    const record = await this.prisma.scheduledNotification.findUnique({
      where: { id: scheduledNotifId },
    });

    // Guard: may have been cancelled while in queue
    if (!record || record.status !== 'PENDING') {
      this.logger.warn(`Scheduled notification ${scheduledNotifId} skipped (status: ${record?.status})`);
      return;
    }

    await this.notificationsService.create({
      level:          record.level,
      motif:          record.motif,
      title:          record.title  ?? undefined,
      message:        record.message ?? undefined,
      recipientRoles: record.recipientRoles,
      caseId:         record.caseId  ?? undefined,
    }, tenantId, record.createdById);

    await this.prisma.scheduledNotification.update({
      where: { id: scheduledNotifId },
      data:  { status: 'SENT' },
    });

    this.logger.log(`Scheduled notification ${scheduledNotifId} dispatched`);
  }
}
