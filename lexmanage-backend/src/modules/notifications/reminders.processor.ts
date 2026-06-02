import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

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
      include: {
        case: { select: { title: true, assigneeId: true } },
      },
    });

    if (!deadline || deadline.isDone) return;

    const targetUserId = deadline.case.assigneeId;
    if (targetUserId) {
        await this.notificationsService.create({
          title: '⏳ Échéance Imminente',
          message: `Le délai "${deadline.title}" pour le dossier "${deadline.case.title}" arrive à échéance le ${deadline.dueAt.toLocaleDateString()}.`,
          priority: deadline.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
          type: 'DEADLINE_REMINDER',
          recipientIds: [targetUserId],
        }, tenantId, 'SYSTEM');
        this.logger.log(`Reminder notification sent to user ${targetUserId}`);
    }
  }
}
