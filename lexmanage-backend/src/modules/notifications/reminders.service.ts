import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    // Run every hour
    setInterval(() => this.checkDeadlines(), 3600000);
    // Initial check
    setTimeout(() => this.checkDeadlines(), 5000);
  }

  async checkDeadlines() {
    this.logger.log('Scanning for upcoming deadlines...');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const deadlines = await this.prisma.deadline.findMany({
      where: {
        isDone: false,
        dueAt: {
          lte: threeDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        case: {
          select: {
            title: true,
            assigneeId: true,
            tenantId: true,
          },
        },
      },
    });

    for (const deadline of deadlines) {
      const targetUserId = deadline.case.assigneeId;
      if (!targetUserId) continue;

      // Check if notification already exists for this deadline to avoid spam
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: targetUserId,
          type: 'DEADLINE_REMINDER',
          message: { contains: deadline.id }, // We'll store ID in message or another field
        },
      });

      if (!existing) {
        await this.notificationsService.create({
          tenantId: deadline.tenantId,
          userId: targetUserId,
          title: '⏳ Échéance Imminente',
          message: `Le délai "${deadline.title}" pour le dossier "${deadline.case.title}" arrive à échéance le ${deadline.dueAt.toLocaleDateString()}. (Ref: ${deadline.id})`,
          priority: deadline.priority === 'URGENT' ? 'HIGH' : 'MEDIUM',
          type: 'DEADLINE_REMINDER',
        });
        this.logger.log(`Reminder created for user ${targetUserId} regarding deadline ${deadline.id}`);
      }
    }
  }
}
