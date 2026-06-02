import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}
  
  // Polling removed in favor of BullMQ scheduled jobs.
}
