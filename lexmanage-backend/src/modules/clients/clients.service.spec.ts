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
    prisma.client.findMany.mockResolvedValue([{ id: 'client-2', name: 'Zoé' }, { id: 'client-1', name: 'Alice' }]);

    await expect(service.findAll('tenant-a')).resolves.toEqual([
      { id: 'client-1', name: 'Alice' }, { id: 'client-2', name: 'Zoé' },
    ]);
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

  it('retourne un client du tenant avec ses dossiers', async () => {
    const client = { id: 'client-1', name: 'Alice', cases: [{ id: 'case-1' }] };
    prisma.client.findFirst.mockResolvedValue(client);
    await expect(service.findOne('client-1', 'tenant-a')).resolves.toBe(client);
  });

  it('crée un client chiffré sans liaison optionnelle', async () => {
    const protection = {
      encrypt: vi.fn((value) => value == null ? value : `enc:${value}`),
      deepDecrypt: vi.fn((value) => ({ ...value, name: 'Alice' })),
      searchTokens: vi.fn(() => ['token']),
    };
    service = new ClientsService(prisma, audit as any, protection as any);
    prisma.client.create.mockResolvedValue({ id: 'client-1', name: 'enc:Alice' });

    await expect(service.create({ name: 'Alice', email: null, phone: '123', address: 'Douala' }, 'tenant-a', 'user-1'))
      .resolves.toEqual({ id: 'client-1', name: 'Alice' });
    expect(prisma.client.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      tenantId: 'tenant-a', name: 'enc:Alice', email: null, phone: 'enc:123', address: 'enc:Douala', searchTokens: ['token'],
    }) });
    expect(prisma.case.findFirst).not.toHaveBeenCalled();
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

  it('continue sans liaison lorsqu’une échéance n’a aucun dossier', async () => {
    prisma.client.create.mockResolvedValue({ id: 'client-1', name: 'Alice' });
    prisma.deadline.findFirst.mockResolvedValue(null);
    await service.create({ name: 'Alice', deadlineId: 'deadline-x' }, 'tenant-a', 'user-1');
    expect(prisma.case.findFirst).not.toHaveBeenCalled();
    expect(prisma.case.update).not.toHaveBeenCalled();
  });

  it('met à jour les champs sensibles et journalise avant/après', async () => {
    const protection = {
      encrypt: vi.fn((value) => value == null ? value : `enc:${value}`),
      deepDecrypt: vi.fn((value) => value),
      searchTokens: vi.fn(() => ['updated-token']),
    };
    service = new ClientsService(prisma, audit as any, protection as any);
    prisma.client.findFirst.mockResolvedValue({
      id: 'client-1', name: 'Alice', email: 'old@test', phone: '111', address: 'Old', cases: [],
    });
    prisma.client.update.mockResolvedValue({ id: 'client-1', name: 'enc:Alicia', email: 'enc:new@test', phone: 'enc:222', address: 'enc:New' });
    const dto = { name: 'Alicia', email: 'new@test', phone: '222', address: 'New' };

    await service.update('client-1', dto, 'tenant-a', 'user-1');
    expect(prisma.client.update).toHaveBeenCalledWith({ where: { id: 'client-1' }, data: {
      name: 'enc:Alicia', email: 'enc:new@test', phone: 'enc:222', address: 'enc:New', searchTokens: ['updated-token'],
    } });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityId: 'client-1' }));
  });

  it('réutilise les valeurs existantes lors d’une mise à jour partielle', async () => {
    const searchTokens = vi.fn(() => []);
    service = new ClientsService(prisma, audit as any, {
      encrypt: (value: unknown) => value, deepDecrypt: (value: unknown) => value, searchTokens,
    } as any);
    prisma.client.findFirst.mockResolvedValue({
      id: 'client-1', name: 'Alice', email: 'old@test', phone: '111', address: 'Old', cases: [],
    });
    prisma.client.update.mockResolvedValue({ id: 'client-1', phone: '222' });
    await service.update('client-1', { phone: '222' }, 'tenant-a', 'user-1');
    expect(searchTokens).toHaveBeenCalledWith(['Alice', 'old@test', '222', 'Old']);
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
