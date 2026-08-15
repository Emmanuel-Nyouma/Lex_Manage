import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  const audit = { log: vi.fn() };
  const prisma: any = {
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    case: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    deadline: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  };
  let service: ClientsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation((callback: (tx: any) => unknown) => callback(prisma));
    service = new ClientsService(prisma, audit as any, {
      encrypt: (value: unknown) => value,
      deepDecrypt: (value: unknown) => value,
      searchTokens: () => [],
    } as any);
  });

  it('scope toujours la liste au tenant courant', async () => {
    prisma.client.findMany.mockResolvedValue([{ id: 'client-1' }]);

    await expect(service.findAll('tenant-a')).resolves.toEqual([{ id: 'client-1' }]);
    expect(prisma.client.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('ne retourne jamais un client absent du tenant', async () => {
    prisma.client.findFirst.mockResolvedValue(null);

    await expect(service.findOne('client-x', 'tenant-a')).rejects.toThrow(NotFoundException);
    expect(prisma.client.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client-x', tenantId: 'tenant-a' },
    }));
  });

  it('résout un dossier via une échéance du même tenant et journalise la création', async () => {
    prisma.client.create.mockResolvedValue({ id: 'client-1', name: 'Alice' });
    prisma.deadline.findFirst.mockResolvedValue({ caseId: 'case-1' });
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });

    const result = await service.create(
      { name: 'Alice', type_client: 'physique', deadlineId: 'deadline-1' },
      'tenant-a',
      'user-1',
    );

    expect(result.id).toBe('client-1');
    expect(prisma.deadline.findFirst).toHaveBeenCalledWith({
      where: { id: 'deadline-1', tenantId: 'tenant-a' },
    });
    expect(prisma.case.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { clientId: 'client-1' },
    });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-a',
      userId: 'user-1',
      entityId: 'client-1',
    }));
  });

  it('refuse de lier un dossier appartenant à un autre tenant', async () => {
    prisma.client.create.mockResolvedValue({ id: 'client-1' });
    prisma.case.findFirst.mockResolvedValue(null);

    await expect(service.create(
      { name: 'Alice', type_client: 'physique', caseId: 'foreign-case' },
      'tenant-a',
      'user-1',
    )).rejects.toThrow('Case not found in your firm');
    expect(prisma.case.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-case', tenantId: 'tenant-a' },
      select: { id: true },
    });
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('délie uniquement les dossiers du tenant avant suppression', async () => {
    prisma.client.findFirst.mockResolvedValue({ id: 'client-1', name: 'Alice', cases: [] });
    prisma.client.delete.mockResolvedValue({ id: 'client-1' });

    await expect(service.remove('client-1', 'tenant-a', 'user-1')).resolves.toEqual({
      message: 'Client deleted',
    });
    expect(prisma.case.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', clientId: 'client-1' },
      data: { clientId: null },
    });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DELETE',
      tenantId: 'tenant-a',
    }));
  });
});
