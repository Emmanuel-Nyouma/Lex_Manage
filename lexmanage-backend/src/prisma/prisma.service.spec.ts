import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => {
  const connect = vi.fn();
  const disconnect = vi.fn();
  const userFindFirst = vi.fn();
  const userFindFirstOrThrow = vi.fn();
  const extendedClient = {
    $connect: connect,
    $disconnect: disconnect,
    user: {
      findFirst: userFindFirst,
      findFirstOrThrow: userFindFirstOrThrow,
    },
  };
  return {
    connect,
    disconnect,
    extendedClient,
    extensionConfig: undefined as any,
    userFindFirst,
    userFindFirstOrThrow,
  };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    $extends(config: unknown) {
      prismaMocks.extensionConfig = config;
      return prismaMocks.extendedClient;
    }
  },
}));

import { tenantContext } from '../common/context/tenant.context';
import { PrismaService } from './prisma.service';

type QueryHandler = (input: {
  model: string;
  args: Record<string, any>;
  query: ReturnType<typeof vi.fn>;
}) => Promise<unknown>;

describe('PrismaService tenant isolation', () => {
  let service: PrismaService;
  let handlers: Record<string, QueryHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrismaService();
    handlers = prismaMocks.extensionConfig.query.$allModels;
  });

  const invoke = (
    operation: string,
    model = 'Case',
    args: Record<string, any> = {},
    query = vi.fn(async (value) => value),
  ) => handlers[operation]({ model, args, query });

  it.each(['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'])(
    'ajoute le tenant aux lectures %s',
    async (operation) => {
      const query = vi.fn(async (args) => args);

      const result = await tenantContext.run('tenant-a', () =>
        invoke(operation, 'Case', { where: { status: 'OPEN' } }, query),
      );

      expect(result).toEqual({ where: { status: 'OPEN', tenantId: 'tenant-a' } });
      expect(query).toHaveBeenCalledOnce();
    },
  );

  it.each(['update', 'updateMany', 'delete', 'deleteMany'])(
    'ajoute le tenant aux écritures %s',
    async (operation) => {
      const result = await tenantContext.run('tenant-a', () =>
        invoke(operation, 'Document', { where: { id: 'record-1' }, data: { title: 'A' } }),
      );

      expect(result).toEqual({
        where: { id: 'record-1', tenantId: 'tenant-a' },
        data: { title: 'A' },
      });
    },
  );

  it('force le tenant lors de la création', async () => {
    const result = await tenantContext.run('tenant-a', () =>
      invoke('create', 'Client', { data: { tenantId: 'tenant-b', name: 'Client' } }),
    );

    expect(result).toEqual({ data: { tenantId: 'tenant-a', name: 'Client' } });
  });

  it('force le tenant pour createMany avec une liste ou un objet', async () => {
    const list = await tenantContext.run('tenant-a', () =>
      invoke('createMany', 'Notification', {
        data: [{ title: 'A' }, { tenantId: 'tenant-b', title: 'B' }],
      }),
    );
    const single = await tenantContext.run('tenant-a', () =>
      invoke('createMany', 'Notification', { data: { title: 'C' } }),
    );

    expect(list).toEqual({
      data: [
        { title: 'A', tenantId: 'tenant-a' },
        { tenantId: 'tenant-a', title: 'B' },
      ],
    });
    expect(single).toEqual({ data: { title: 'C', tenantId: 'tenant-a' } });
  });

  it('scope les trois branches de upsert', async () => {
    const result = await tenantContext.run('tenant-a', () =>
      invoke('upsert', 'User', {
        where: { id: 'user-1' },
        create: { email: 'a@example.com' },
        update: { firstName: 'Ada' },
      }),
    );

    expect(result).toEqual({
      where: { id: 'user-1', tenantId: 'tenant-a' },
      create: { email: 'a@example.com', tenantId: 'tenant-a' },
      update: { firstName: 'Ada', tenantId: 'tenant-a' },
    });
  });

  it('remplace findUnique par une lecture compatible avec le filtre tenant', async () => {
    prismaMocks.userFindFirst.mockResolvedValue({ id: 'user-1' });
    prismaMocks.userFindFirstOrThrow.mockResolvedValue({ id: 'user-2' });
    const originalQuery = vi.fn();

    const first = await tenantContext.run('tenant-a', () =>
      invoke('findUnique', 'User', { where: { email: 'a@example.com' } }, originalQuery),
    );
    const required = await tenantContext.run('tenant-a', () =>
      invoke('findUniqueOrThrow', 'User', { where: { id: 'user-2' } }, originalQuery),
    );

    expect(first).toEqual({ id: 'user-1' });
    expect(required).toEqual({ id: 'user-2' });
    expect(prismaMocks.userFindFirst).toHaveBeenCalledWith({
      where: { email: 'a@example.com', tenantId: 'tenant-a' },
    });
    expect(prismaMocks.userFindFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'user-2', tenantId: 'tenant-a' },
    });
    expect(originalQuery).not.toHaveBeenCalled();
  });

  it.each([
    'findMany',
    'findFirst',
    'findUnique',
    'findUniqueOrThrow',
    'count',
    'aggregate',
    'groupBy',
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
    'delete',
    'deleteMany',
  ])('refuse %s sans contexte tenant', async (operation) => {
    await expect(invoke(operation)).rejects.toThrow(/without tenantId context/);
  });

  it('laisse passer les modèles globaux et les opérations explicitement non scopées', async () => {
    const globalQuery = vi.fn(async (args) => args);
    const unscopedQuery = vi.fn(async (args) => args);

    await invoke('findMany', 'GlobalSetting', { where: { id: 'global' } }, globalQuery);
    await tenantContext.runUnscoped(() =>
      invoke('findMany', 'Case', { where: { id: 'case-1' } }, unscopedQuery),
    );

    expect(globalQuery).toHaveBeenCalledWith({ where: { id: 'global' } });
    expect(unscopedQuery).toHaveBeenCalledWith({ where: { id: 'case-1' } });
  });

  it.each([
    'findMany', 'findFirst', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate',
    'groupBy', 'create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany',
  ])('laisse passer %s sur un modèle global', async (operation) => {
    const query = vi.fn(async (args) => args);
    await invoke(operation, 'GlobalSetting', { where: { id: 'global' } }, query);
    expect(query).toHaveBeenCalledOnce();
  });

  it('délègue les autres méthodes de classe au client étendu', () => {
    expect((service as any).constructor).toBe(Object);
  });

  it('délègue les lectures uniques non scopées au client Prisma original', async () => {
    const query = vi.fn(async () => 'original');

    await expect(
      tenantContext.runUnscoped(() => invoke('findUnique', 'User', {}, query)),
    ).resolves.toBe('original');
    await expect(
      tenantContext.runUnscoped(() => invoke('findUniqueOrThrow', 'User', {}, query)),
    ).resolves.toBe('original');
  });

  it('connecte et déconnecte le client étendu avec le cycle Nest', async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(prismaMocks.connect).toHaveBeenCalledOnce();
    expect(prismaMocks.disconnect).toHaveBeenCalledOnce();
  });
});
