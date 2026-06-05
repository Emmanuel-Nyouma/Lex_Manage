import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { getQueueToken } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

describe('CasesService', () => {
  let service: CasesService;
  let prisma: PrismaService;
  let cacheManager: any;

  const mockPrisma = {
    case: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    document: {
        updateMany: jest.fn(),
    }
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: { sendToTenant: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: getQueueToken('reminders'), useValue: { add: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cached data if available', async () => {
      const mockResult = { data: [], meta: {} };
      mockCacheManager.get.mockResolvedValue(mockResult);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(mockResult);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(prisma.case.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.case.findMany.mockResolvedValue([]);
      mockPrisma.case.count.mockResolvedValue(0);

      const result = (await service.findAll('tenant-1')) as any;

      expect(result.data).toEqual([]);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if case not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.case.findFirst.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
