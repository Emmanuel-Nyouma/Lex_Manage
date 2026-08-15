import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { getQueueToken } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataProtectionService } from '../security/data-protection.service';

describe('CasesService', () => {
  let service: CasesService;
  let prisma: PrismaService;
  let cacheManager: any;
  let eventsGateway: any;
  let auditService: any;
  let protection: any;

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
    },
    notification: { updateMany: jest.fn() },
    scheduledNotification: { updateMany: jest.fn() },
    client: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
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
        {
          provide: DataProtectionService,
          useValue: {
            encrypt: jest.fn((value: unknown) => value == null ? value : `encrypted:${value}`),
            deepDecrypt: jest.fn((value: unknown) => value),
            searchTokens: jest.fn(() => ['token']),
          },
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    eventsGateway = module.get(EventsGateway);
    auditService = module.get(AuditService);
    protection = module.get(DataProtectionService);
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    mockPrisma.document.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.scheduledNotification.updateMany.mockResolvedValue({ count: 1 });
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

    it('paginates with a stable cursor and decrypts before caching', async () => {
      mockPrisma.case.findMany.mockResolvedValue([
        { id: 'case-3' },
        { id: 'case-2' },
        { id: 'case-1' },
      ]);

      const result = await service.findAll('tenant-1', 'previous', 2) as any;

      expect(mockPrisma.case.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-1' },
        take: 3,
        cursor: { id: 'previous' },
        skip: 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }));
      expect(protection.deepDecrypt).toHaveBeenCalled();
      expect(result).toEqual({
        data: [{ id: 'case-3' }, { id: 'case-2' }],
        meta: { limit: 2, nextCursor: 'case-2', hasMore: true },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'cases:tenant-1:cursor:previous:2', result, 30000,
      );
    });
  });

  describe('findOne', () => {
    it('returns an individually cached case without querying Prisma', async () => {
      const cached = { id: 'case-1', title: 'Cached' };
      mockCacheManager.get.mockResolvedValue(cached);
      await expect(service.findOne('case-1', 'tenant-1')).resolves.toBe(cached);
      expect(mockPrisma.case.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if case not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrisma.case.findFirst.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('decrypts and caches a case fetched for its tenant', async () => {
      const found = { id: 'case-1', title: 'encrypted:title' };
      mockPrisma.case.findFirst.mockResolvedValue(found);

      await expect(service.findOne('case-1', 'tenant-1')).resolves.toEqual(found);
      expect(mockPrisma.case.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'case-1', tenantId: 'tenant-1' },
      }));
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'case:tenant-1:case-1', found, 60000,
      );
    });
  });

  describe('create', () => {
    it('encrypts sensitive fields, attaches documents and emits an audited tenant event', async () => {
      mockPrisma.case.create.mockImplementation(async ({ data }) => ({ id: 'case-1', ...data }));
      const dto: any = {
        title: 'Contrat',
        description: 'Litige commercial',
        clientName: 'Acme',
        courtName: 'Tribunal',
        caseNumber: 'RG-42',
        clientId: 'client-1',
        documentIds: ['doc-1'],
      };

      const result: any = await service.create(dto, 'tenant-1', 'user-1');

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: { id: 'client-1', tenantId: 'tenant-1' }, select: { id: true },
      });
      expect(mockPrisma.case.create).toHaveBeenCalledWith({ data: expect.objectContaining({
        tenantId: 'tenant-1',
        assigneeId: 'user-1',
        title: 'encrypted:Contrat',
        description: 'encrypted:Litige commercial',
        clientName: 'encrypted:Acme',
        courtName: 'encrypted:Tribunal',
        caseNumber: 'encrypted:RG-42',
        searchTokens: ['token'],
      }) });
      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc-1'] }, tenantId: 'tenant-1' },
        data: { case_id: 'case-1', isPending: false },
      });
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-1', userId: 'user-1', action: 'CREATE', entityId: 'case-1',
      }));
      expect(eventsGateway.sendToTenant).toHaveBeenCalledWith('tenant-1', 'case.created', result);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(5);
    });

    it('uses an explicit assignee and skips document linking when none are supplied', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'lawyer-1' });
      mockPrisma.case.create.mockImplementation(async ({ data }) => ({ id: 'case-2', ...data }));

      await service.create({ title: 'Dossier', assigneeId: 'lawyer-1' } as any, 'tenant-1', 'user-1');

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'lawyer-1', tenantId: 'tenant-1', isActive: true }, select: { id: true },
      });
      expect(mockPrisma.document.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      ['client', () => mockPrisma.client.findFirst.mockResolvedValue(null), { clientId: 'foreign' }],
      ['assignee', () => mockPrisma.user.findFirst.mockResolvedValue(null), { assigneeId: 'foreign' }],
    ])('rejects a foreign %s reference', async (_label, arrange, fields) => {
      arrange();
      await expect(service.create({ title: 'Dossier', ...fields } as any, 'tenant-1', 'user-1'))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.case.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockPrisma.case.findFirst.mockResolvedValue({
        id: 'case-1', title: 'Old', description: 'Old description', clientName: 'Acme',
        courtName: 'Old court', caseNumber: 'Old number',
      });
      mockPrisma.case.update.mockImplementation(async ({ data }) => ({ id: 'case-1', ...data }));
    });

    it('encrypts changed fields, closes the case and links added documents', async () => {
      const result: any = await service.update('case-1', {
        title: 'New', description: 'New description', courtName: 'New court',
        caseNumber: 'New number', status: 'CLOSED', documentIds: ['doc-2'],
      } as any, 'tenant-1', 'user-1');

      expect(mockPrisma.case.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: expect.objectContaining({
          title: 'encrypted:New',
          description: 'encrypted:New description',
          courtName: 'encrypted:New court',
          caseNumber: 'encrypted:New number',
          closedAt: expect.any(Date),
          searchTokens: ['token'],
        }),
      });
      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc-2'] }, tenantId: 'tenant-1' }, data: { case_id: 'case-1' },
      });
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE', details: expect.objectContaining({ after: result }),
      }));
      expect(mockCacheManager.del).toHaveBeenCalledWith('case:tenant-1:case-1');
    });

    it('reopens a case and preserves previous searchable values', async () => {
      await service.update('case-1', { status: 'OPEN' } as any, 'tenant-1', 'user-1');

      expect(mockPrisma.case.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: expect.objectContaining({ closedAt: null }),
      });
      expect(protection.searchTokens).toHaveBeenCalledWith([
        'Old', 'Old description', 'Acme', 'Old court', 'Old number',
      ]);
      expect(mockPrisma.document.updateMany).not.toHaveBeenCalled();
    });

    it('keeps closedAt untouched when status is omitted', async () => {
      await service.update('case-1', { title: 'Renamed' } as any, 'tenant-1', 'user-1');
      expect(mockPrisma.case.update.mock.calls[0][0].data.closedAt).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('detaches every dependent record before deleting and auditing the case', async () => {
      mockPrisma.case.findFirst.mockResolvedValue({ id: 'case-1', title: 'Dossier' });
      mockPrisma.case.delete.mockResolvedValue({ id: 'case-1' });

      await expect(service.remove('case-1', 'tenant-1', 'user-1'))
        .resolves.toEqual({ message: 'Case deleted' });

      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', case_id: 'case-1' }, data: { case_id: null },
      });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', caseId: 'case-1' }, data: { caseId: null },
      });
      expect(mockPrisma.scheduledNotification.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', caseId: 'case-1' }, data: { caseId: null },
      });
      expect(mockPrisma.case.delete).toHaveBeenCalledWith({ where: { id: 'case-1' } });
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'DELETE', entityId: 'case-1',
      }));
    });
  });
});
