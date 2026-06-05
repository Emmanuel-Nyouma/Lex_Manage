import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockMailQueue = {
    add: jest.fn(),
  };

  const mockEventsGateway = {
    sendToTenant: jest.fn(),
  };

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: getQueueToken('mail'), useValue: mockMailQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return notifications for tenant and user', async () => {
      const mockNotifications = [{ id: '1', title: 'Test' }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await service.findAll('user-1', 'tenant-1');

      expect(result).toEqual(mockNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
        })
      }));
    });
  });

  describe('markAsRead', () => {
    it('should add userId to readByIds if not already present', async () => {
      const mockNotification = { id: '1', readByIds: [], tenantId: 'tenant-1' };
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotification);
      (prisma.notification.update as jest.Mock).mockResolvedValue({ ...mockNotification, readByIds: ['user-1'] });

      const result = await service.markAsRead('1', 'user-1', 'tenant-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { readByIds: { push: 'user-1' } }
      });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.markAsRead('999', 'user-1', 'tenant-1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
