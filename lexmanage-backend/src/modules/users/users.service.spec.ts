import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from './dto/user.dto';
import { UsersService } from './users.service';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService', () => {
  const prisma: any = {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };
  const audit = { log: vi.fn() };
  const cache = { get: vi.fn(), set: vi.fn(), del: vi.fn() };
  const protection = { deepDecrypt: vi.fn((value) => value) };
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    cache.get.mockResolvedValue(undefined);
    protection.deepDecrypt.mockImplementation((value) => value);
    service = new UsersService(prisma, audit as any, cache as any, protection as any);
  });

  it('met en cache la version déchiffrée de la liste', async () => {
    const encrypted = [{ id: 'user-1', firstName: 'enc:v1:value' }];
    const decrypted = [{ id: 'user-1', firstName: 'Alice' }];
    prisma.user.findMany.mockResolvedValue(encrypted);
    protection.deepDecrypt.mockReturnValue(decrypted);

    await expect(service.findAll('tenant-a')).resolves.toEqual(decrypted);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a' },
    }));
    expect(cache.set).toHaveBeenCalledWith('users:tenant-a', decrypted, 60000);
  });

  it('retourne directement une liste déjà déchiffrée depuis le cache', async () => {
    const cached = [{ id: 'user-1', firstName: 'Alice' }];
    cache.get.mockResolvedValue(cached);

    await expect(service.findAll('tenant-a')).resolves.toBe(cached);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('scope un utilisateur au tenant et met la version déchiffrée en cache', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', firstName: 'encrypted' });
    protection.deepDecrypt.mockReturnValue({ id: 'user-1', firstName: 'Alice' });

    await expect(service.findOne('user-1', 'tenant-a')).resolves.toEqual({
      id: 'user-1', firstName: 'Alice',
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', tenantId: 'tenant-a' },
    }));
    expect(cache.set).toHaveBeenCalledWith(
      'user:tenant-a:user-1',
      { id: 'user-1', firstName: 'Alice' },
      300000,
    );
  });

  it('rejette un utilisateur absent du tenant', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findOne('foreign', 'tenant-a')).rejects.toThrow(NotFoundException);
  });

  it('normalise l’email, hache le mot de passe et journalise la création', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'user-2', email: 'member@example.com', role: UserRole.LAWYER });
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    await service.create({
      firstName: 'New', lastName: 'Member', email: ' MEMBER@Example.com ',
      password: 'secure-password', role: UserRole.LAWYER,
    }, 'tenant-a', 'admin-1');

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'member@example.com', passwordHash: 'hashed-password', tenantId: 'tenant-a',
      }),
    }));
    expect(cache.del).toHaveBeenCalledWith('users:tenant-a');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE', tenantId: 'tenant-a', userId: 'admin-1', entityId: 'user-2',
    }));
  });

  it('rejette un email déjà utilisé', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({
      firstName: 'New', lastName: 'Member', email: 'used@example.com',
      password: 'secure-password', role: UserRole.LAWYER,
    }, 'tenant-a', 'admin-1')).rejects.toThrow(ConflictException);
  });

  it('interdit SUPER_ADMIN et l’auto-rétrogradation', async () => {
    vi.spyOn(service, 'findOne').mockResolvedValue({ role: UserRole.CABINET_ADMIN } as any);

    await expect(service.update('member-1', { role: UserRole.SUPER_ADMIN }, 'tenant-a', 'admin-1'))
      .rejects.toThrow(BadRequestException);
    await expect(service.update('admin-1', { role: UserRole.LAWYER }, 'tenant-a', 'admin-1'))
      .rejects.toThrow('You cannot demote your own administrator account');
  });

  it('conserve au moins un administrateur actif', async () => {
    vi.spyOn(service, 'findOne').mockResolvedValue({ role: UserRole.CABINET_ADMIN } as any);
    prisma.user.count.mockResolvedValue(1);

    await expect(service.update('admin-2', { role: UserRole.LAWYER }, 'tenant-a', 'admin-1'))
      .rejects.toThrow('The firm must keep at least one active administrator');
  });

  it('met à jour, invalide les caches et journalise', async () => {
    vi.spyOn(service, 'findOne').mockResolvedValue({ role: UserRole.LAWYER } as any);
    prisma.user.update.mockResolvedValue({ id: 'member-1', role: UserRole.ASSISTANT });

    await service.update('member-1', { role: UserRole.ASSISTANT }, 'tenant-a', 'admin-1');

    expect(cache.del).toHaveBeenCalledWith('user:tenant-a:member-1');
    expect(cache.del).toHaveBeenCalledWith('users:tenant-a');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
  });

  it('déchiffre les collègues et révoque les sessions lors de la désactivation', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'member-1', firstName: 'encrypted' }]);
    protection.deepDecrypt.mockReturnValue([{ id: 'member-1', firstName: 'Alice' }]);
    await expect(service.findColleagues('tenant-a')).resolves.toEqual([{ id: 'member-1', firstName: 'Alice' }]);

    vi.spyOn(service, 'findOne').mockResolvedValue({ role: UserRole.LAWYER } as any);
    prisma.user.update.mockResolvedValue({});
    await expect(service.deactivate('member-1', 'tenant-a', 'admin-1')).resolves.toEqual({
      message: 'User deactivated',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: {
        isActive: false,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('interdit de désactiver son propre compte', async () => {
    vi.spyOn(service, 'findOne').mockResolvedValue({ role: UserRole.LAWYER } as any);
    await expect(service.deactivate('admin-1', 'tenant-a', 'admin-1'))
      .rejects.toThrow('You cannot deactivate your own account');
  });
});
