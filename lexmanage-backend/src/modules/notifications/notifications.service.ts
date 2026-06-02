import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async findAll(userId: string, tenantId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        user_id: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    return this.prisma.notification.count({
      where: {
        tenantId,
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, user_id: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
  }

  async create(dto: CreateNotificationDto, tenantId: string, createdById: string) {
    const { recipientIds, ...data } = dto;

    const targets = recipientIds?.length 
      ? recipientIds 
      : (await this.prisma.user.findMany({ where: { tenantId, isActive: true }, select: { id: true } })).map(u => u.id);

    const createdNotifications = [];

    for (const targetUserId of targets) {
      const notification = await this.prisma.notification.create({
        data: {
          title: dto.title,
          message: dto.message || '',
          priority: dto.priority || 'MEDIUM',
          type: dto.type,
          tenantId,
          user_id: targetUserId,
        },
        include: {
          tenant: { select: { name: true } },
          users: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      createdNotifications.push(notification);

      // Real-time emission to the specific user
      // Assuming eventsGateway has a sendToUser method or we use tenant-wide for now
      this.eventsGateway.sendToTenant(tenantId, 'notification.new', notification);

      // If HIGH priority (URGENT), queue emails
      if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
        await this.mailQueue.add('send-urgent-notification', {
          to: notification.users.email,
          data: {
            firmName: notification.tenant.name,
            motifLabel: notification.type || 'Notification',
            message: notification.message,
            senderName: createdById === 'SYSTEM' ? 'Système LexManage' : 'Un collaborateur',
            timestamp: notification.createdAt,
          },
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        });
      }
    }

    return createdNotifications[0];
  }
}
