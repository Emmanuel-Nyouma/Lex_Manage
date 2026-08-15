import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationLevel, NotificationMotif } from '@prisma/client';
import { tenantContext } from '../../common/context/tenant.context';

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
    return tenantContext.run(tenantId, async () => {
      const deadline = await this.prisma.deadline.findUnique({
        where: { id: deadlineId },
        include: { case: { select: { title: true, assigneeId: true } } },
      });
      if (!deadline || deadline.isDone) return;

      const targetUserId = deadline.case?.assigneeId;
      if (targetUserId) {
        await this.notificationsService.create({
          title: '⏳ Échéance imminente',
          message: `Le délai "${deadline.title}" pour le dossier "${deadline.case?.title}" arrive à échéance le ${deadline.dueAt.toLocaleDateString('fr-FR')}.`,
          level: deadline.priority === 'URGENT' ? NotificationLevel.URGENT : NotificationLevel.IMPORTANT,
          motif: NotificationMotif.DEADLINE,
          recipientIds: [targetUserId],
          idempotencyKey: `deadline:${deadlineId}:reminder`,
        }, tenantId, null);
        this.logger.log(`Reminder sent to user ${targetUserId}`);
      }
    });
  }

  @Process('send-scheduled-notification')
  async handleScheduledNotification(job: Job) {
    this.logger.log(`Processing scheduled notification job ${job.id}`);
    const { scheduledNotifId, tenantId } = job.data;

    return tenantContext.run(tenantId, async () => {
      const claimed = await this.prisma.scheduledNotification.updateMany({
        where: { id: scheduledNotifId, status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count !== 1) {
        this.logger.warn(`Scheduled notification ${scheduledNotifId} already handled`);
        return;
      }
      try {
        const record = await this.prisma.scheduledNotification.findUniqueOrThrow({
          where: { id: scheduledNotifId },
        });
        await this.notificationsService.create({
          level: record.level,
          motif: record.motif,
          title: record.title ?? undefined,
          message: record.message ?? undefined,
          recipientRoles: record.recipientRoles,
          caseId: record.caseId ?? undefined,
          idempotencyKey: `scheduled:${scheduledNotifId}`,
        }, tenantId, record.createdById);

        await this.prisma.scheduledNotification.update({
          where: { id: scheduledNotifId },
          data: { status: 'SENT' },
        });
        this.logger.log(`Scheduled notification ${scheduledNotifId} dispatched`);
      } catch (error) {
        await this.prisma.scheduledNotification.updateMany({
          where: { id: scheduledNotifId, status: 'PROCESSING' },
          data: { status: 'PENDING' },
        });
        throw error;
      }
    });
  }
}
