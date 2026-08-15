import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  const prisma: any = {
    auditLog: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  };
  const protection = {
    encryptJson: vi.fn((value) => `encrypted:${JSON.stringify(value)}`),
    deepDecrypt: vi.fn((value) => value),
  };
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService(prisma, protection as any);
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
    delete process.env.AUDIT_RETENTION_DAYS;
  });

  it('programme puis annule les nettoyages de rétention', () => {
    vi.useFakeTimers();
    const cleanup = vi.spyOn(service, 'cleanupExpiredLogs').mockResolvedValue(0);
    service.onModuleInit();
    vi.advanceTimersByTime(30_000);
    expect(cleanup).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('chiffre les détails et propage les erreurs d’écriture', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });
    await service.log({
      tenantId: 'tenant-a', userId: 'user-1', action: 'UPDATE', entity: 'Case',
      entityId: 'case-1', details: { field: 'title' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      details: 'encrypted:{"field":"title"}',
    }) });

    prisma.auditLog.create.mockRejectedValue(new Error('database offline'));
    await expect(service.log({
      tenantId: 'tenant-a', userId: 'user-1', action: 'READ', entity: 'Case', entityId: 'case-1',
    })).rejects.toThrow('database offline');
  });

  it('borne la pagination et produit un curseur suivant', async () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({ id: `log-${index}` }));
    prisma.auditLog.findMany.mockResolvedValue(rows);

    const result = await service.getLogs('tenant-a', 999, 'cursor-1');

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a' }, take: 101, cursor: { id: 'cursor-1' }, skip: 1,
    }));
    expect(result.data).toHaveLength(100);
    expect(result.meta).toEqual({ limit: 100, hasMore: true, nextCursor: 'log-99' });
  });

  it('utilise la limite par défaut si la valeur n’est pas finie', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    await expect(service.getLogs('tenant-a', Number.NaN)).resolves.toEqual({
      data: [], meta: { limit: 50, hasMore: false, nextCursor: null },
    });
  });

  it('supprime les journaux expirés hors contexte tenant et tolère une panne', async () => {
    process.env.AUDIT_RETENTION_DAYS = '90';
    prisma.auditLog.deleteMany.mockResolvedValue({ count: 3 });
    await expect(service.cleanupExpiredLogs()).resolves.toBe(3);
    const cutoff = prisma.auditLog.deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    expect(cutoff).toBeInstanceOf(Date);

    prisma.auditLog.deleteMany.mockRejectedValue(new Error('offline'));
    await expect(service.cleanupExpiredLogs()).resolves.toBe(0);
  });

  it('journalise une erreur système sans la lancer', () => {
    expect(() => service.logSystemError(new Error('boom'), { requestId: 'req-1' })).not.toThrow();
  });
});
