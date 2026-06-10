import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationLevel, NotificationMotif } from '@prisma/client';

export interface CreateTemplateDto {
  name: string;
  level: NotificationLevel;
  motif: NotificationMotif;
  title?: string;
  message?: string;
  recipientRoles?: string[];
}

export interface CreateScheduledDto {
  level: NotificationLevel;
  motif: NotificationMotif;
  title?: string;
  message?: string;
  recipientRoles?: string[];
  scheduledAt: string; // ISO string
  caseId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @InjectQueue('mail')      private mailQueue: Queue,
    @InjectQueue('reminders') private remindersQueue: Queue,
  ) {}

  async findAll(userId: string, tenantId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        OR: [
          { recipientIds: { has: userId } },
          { recipientIds: { isEmpty: true } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    return this.prisma.notification.count({
      where: {
        tenantId,
        OR: [
          { recipientIds: { has: userId } },
          { recipientIds: { isEmpty: true } }
        ],
        NOT: {
          readByIds: { has: userId }
        }
      },
    });
  }

  async markAsRead(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { 
        id, 
        tenantId,
        OR: [
          { recipientIds: { has: userId } },
          { recipientIds: { isEmpty: true } }
        ]
      },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    // Avoid duplicate entries in readByIds
    if (notification.readByIds.includes(userId)) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        readByIds: { push: userId }
      },
    });
  }

  async markAllAsRead(userId: string, tenantId: string) {
    const unread = await this.prisma.notification.findMany({
      where: {
        tenantId,
        OR: [
          { recipientIds: { has: userId } },
          { recipientIds: { isEmpty: true } },
        ],
        NOT: { readByIds: { has: userId } },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { count: 0 };

    await this.prisma.$transaction(
      unread.map((n) =>
        this.prisma.notification.update({
          where: { id: n.id },
          data: { readByIds: { push: userId } },
        }),
      ),
    );

    return { count: unread.length };
  }

  async create(dto: any, tenantId: string, createdById: string) {
    const { recipientIds, recipientRoles, caseId, ...data } = dto;

    let finalRecipientIds = recipientIds || [];

    // If roles are specified, expand them to user IDs
    if (recipientRoles && recipientRoles.length > 0) {
      const usersWithRoles = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: { in: recipientRoles },
          isActive: true,
        },
        select: { id: true },
      });
      const roleUserIds = usersWithRoles.map(u => u.id);
      finalRecipientIds = Array.from(new Set([...finalRecipientIds, ...roleUserIds]));
    }

    // Ensure the sender always receives a copy of their own targeted notification.
    // (When finalRecipientIds is empty the notification is firm-wide and already
    //  reaches everyone, including the sender.)
    if (
      finalRecipientIds.length > 0 &&
      createdById !== 'SYSTEM' &&
      !finalRecipientIds.includes(createdById)
    ) {
      finalRecipientIds.push(createdById);
    }

    const notification = await this.prisma.notification.create({
      data: {
        level: dto.level,
        motif: dto.motif,
        title: dto.title,
        message: dto.message || '',
        tenantId,
        createdById,
        recipientIds: finalRecipientIds,
        readByIds: [],
        caseId: caseId || null,
      },
      include: {
        tenant: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Real-time emission
    if (finalRecipientIds.length > 0) {
      // Send to specific users via gateway if implemented, 
      // otherwise broadcast and filter on client (current sendToTenant approach)
      this.eventsGateway.sendToTenant(tenantId, 'notification.new', notification);
    } else {
      this.eventsGateway.sendToTenant(tenantId, 'notification.new', notification);
    }

    // If URGENT level, queue emails
    if (notification.level === 'URGENT') {
      const targets = finalRecipientIds.length 
        ? await this.prisma.user.findMany({ where: { id: { in: finalRecipientIds }, tenantId, isActive: true }, select: { email: true } })
        : await this.prisma.user.findMany({ where: { tenantId, isActive: true }, select: { email: true } });

      for (const targetUser of targets) {
        await this.mailQueue.add('send-urgent-notification', {
          to: targetUser.email,
          data: {
            firmName: notification.tenant.name,
            motifLabel: notification.motif,
            message: notification.message,
            senderName: createdById === 'SYSTEM' ? 'Système LexManage' : `${notification.createdBy.firstName} ${notification.createdBy.lastName}`,
            timestamp: notification.createdAt,
          },
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        });
      }
    }

    return notification;
  }

  // ── History ───────────────────────────────────────────────────────

  async getHistory(tenantId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        NOT: { createdById: 'SYSTEM' },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        case:      { select: { title: true, caseNumber: true } },
      },
    });
  }

  /** Delete a sent notification from the firm history (admin only). */
  async deleteFromHistory(tenantId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, tenantId } });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  // ── Templates ────────────────────────────────────────────────────

  async getTemplates(tenantId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async createTemplate(tenantId: string, createdById: string, dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        tenantId,
        createdById,
        name:           dto.name,
        level:          dto.level,
        motif:          dto.motif,
        title:          dto.title,
        message:        dto.message,
        recipientRoles: dto.recipientRoles ?? [],
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const tpl = await this.prisma.notificationTemplate.findFirst({ where: { id, tenantId } });
    if (!tpl) throw new NotFoundException('Template not found');
    await this.prisma.notificationTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

  // ── Scheduled ────────────────────────────────────────────────────

  async getScheduled(tenantId: string) {
    return this.prisma.scheduledNotification.findMany({
      where: { tenantId },
      orderBy: { scheduledAt: 'asc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        case:      { select: { title: true, caseNumber: true } },
      },
    });
  }

  async createScheduled(tenantId: string, createdById: string, dto: CreateScheduledDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    // Create the DB record first (no jobId yet)
    const record = await this.prisma.scheduledNotification.create({
      data: {
        tenantId,
        createdById,
        level:          dto.level,
        motif:          dto.motif,
        title:          dto.title,
        message:        dto.message,
        recipientRoles: dto.recipientRoles ?? [],
        scheduledAt,
        caseId: dto.caseId || null,
        status: 'PENDING',
      },
    });

    // Schedule the BullMQ delayed job
    const delay = scheduledAt.getTime() - Date.now();
    const job = await this.remindersQueue.add(
      'send-scheduled-notification',
      { scheduledNotifId: record.id, tenantId },
      { delay, jobId: `sched-${record.id}`, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    // Persist the jobId for later cancellation
    return this.prisma.scheduledNotification.update({
      where: { id: record.id },
      data: { jobId: String(job.id) },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        case:      { select: { title: true, caseNumber: true } },
      },
    });
  }

  async cancelScheduled(tenantId: string, id: string) {
    const record = await this.prisma.scheduledNotification.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Scheduled notification not found');
    if (record.status !== 'PENDING') throw new BadRequestException('Only PENDING notifications can be cancelled');

    // Remove BullMQ job
    if (record.jobId) {
      try {
        const job = await this.remindersQueue.getJob(record.jobId);
        if (job) await job.remove();
      } catch {
        // Job may have already fired — ignore
      }
    }

    return this.prisma.scheduledNotification.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /** Permanently delete a scheduled notification (any status). Removes the BullMQ job if still pending. */
  async deleteScheduled(tenantId: string, id: string) {
    const record = await this.prisma.scheduledNotification.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Scheduled notification not found');

    if (record.status === 'PENDING' && record.jobId) {
      try {
        const job = await this.remindersQueue.getJob(record.jobId);
        if (job) await job.remove();
      } catch {
        // Job may have already fired — ignore
      }
    }

    await this.prisma.scheduledNotification.delete({ where: { id } });
    return { message: 'Scheduled notification deleted' };
  }
}
