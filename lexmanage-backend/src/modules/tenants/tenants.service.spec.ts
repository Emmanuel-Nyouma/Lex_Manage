import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  const prisma: any = {
    tenant: { findUnique: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn() },
    invitation: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
  };
  const minio = { getAssetUrl: vi.fn(), uploadFile: vi.fn() };
  let service: TenantsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TenantsService(prisma, minio as any);
  });

  it('retourne les statistiques de rôles et signe le logo', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-a', name: 'Cabinet', logoUrl: 'logos/logo.png',
      _count: { users: 5, cases: 2, documents: 3 },
      users: [
        { role: 'CABINET_ADMIN' }, { role: 'SUPER_ADMIN' }, { role: 'LAWYER' },
        { role: 'ASSISTANT' }, { role: 'SECRETARY' },
      ],
    });
    minio.getAssetUrl.mockResolvedValue('https://signed/logo.png');

    await expect(service.findOne('tenant-a')).resolves.toEqual({
      id: 'tenant-a', name: 'Cabinet', logoUrl: 'https://signed/logo.png',
      _count: { users: 5, cases: 2, documents: 3 },
      roleStats: { admins: 2, lawyers: 1, assistants: 1, secretaries: 1 },
    });
  });

  it('tolère l’échec de signature du logo et rejette un tenant absent', async () => {
    prisma.tenant.findUnique.mockResolvedValueOnce({
      id: 'tenant-a', logoUrl: 'logos/logo.png', _count: {}, users: [],
    });
    minio.getAssetUrl.mockRejectedValue(new Error('storage offline'));
    await expect(service.getMyTenant('tenant-a')).resolves.toEqual(expect.objectContaining({ logoUrl: null }));

    prisma.tenant.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('liste uniquement les membres du tenant', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'member-1' }]);
    await service.getMembers('tenant-a');
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a' },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    }));
  });

  it('normalise et crée une invitation valable sept jours', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.invitation.findFirst.mockResolvedValue(null);
    prisma.invitation.create.mockImplementation(({ data }: any) => ({ id: 'invite-1', ...data }));

    const before = Date.now();
    const result = await service.createInvitation('tenant-a', {
      email: ' MEMBER@Example.com ', role: 'LAWYER' as any,
    });

    expect(result.email).toBe('member@example.com');
    expect(result.token).toMatch(/^[a-f0-9]{32}$/);
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 6 * 86_400_000);
  });

  it('rejette une invitation pour un utilisateur ou une invitation active existante', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    prisma.invitation.findFirst.mockResolvedValue(null);
    await expect(service.createInvitation('tenant-a', {
      email: 'used@example.com', role: 'LAWYER' as any,
    })).rejects.toThrow(ConflictException);

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.invitation.findFirst.mockResolvedValue({ id: 'pending' });
    await expect(service.createInvitation('tenant-a', {
      email: 'pending@example.com', role: 'LAWYER' as any,
    })).rejects.toThrow('An active invitation already exists');
  });

  it('liste et révoque seulement les invitations du tenant', async () => {
    prisma.invitation.findMany.mockResolvedValue([{ id: 'invite-1' }]);
    await service.getInvitations('tenant-a');
    expect(prisma.invitation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a', used: false }),
    }));

    prisma.invitation.findFirst.mockResolvedValue({ id: 'invite-1' });
    await expect(service.revokeInvitation('tenant-a', 'invite-1')).resolves.toEqual({ message: 'Invitation revoked' });
    expect(prisma.invitation.delete).toHaveBeenCalledWith({ where: { id: 'invite-1' } });

    prisma.invitation.findFirst.mockResolvedValue(null);
    await expect(service.revokeInvitation('tenant-a', 'foreign')).rejects.toThrow(NotFoundException);
  });

  it('interdit l’auto-rétrogradation et protège le dernier administrateur', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'admin-1', role: 'CABINET_ADMIN', isActive: true });
    await expect(service.updateMember('tenant-a', 'admin-1', 'admin-1', { role: 'LAWYER' as any }))
      .rejects.toThrow(BadRequestException);

    prisma.user.findFirst.mockResolvedValue({ id: 'admin-2', role: 'CABINET_ADMIN', isActive: true });
    prisma.user.count.mockResolvedValue(1);
    await expect(service.updateMember('tenant-a', 'admin-1', 'admin-2', { isActive: false }))
      .rejects.toThrow('The firm must keep at least one active administrator');
  });

  it('révoque les sessions lorsqu’un membre est désactivé via mise à jour', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'member-1', role: 'LAWYER', isActive: true });
    prisma.user.update.mockResolvedValue({ id: 'member-1', isActive: false });

    await service.updateMember('tenant-a', 'admin-1', 'member-1', { isActive: false });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'member-1' },
      data: {
        isActive: false,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    }));
  });

  it('désactive un membre, reste idempotent et révoque toutes ses sessions', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ id: 'member-1', role: 'LAWYER', isActive: false });
    await expect(service.deactivateMember('tenant-a', 'member-1')).resolves.toEqual({
      message: 'Member is already inactive',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();

    prisma.user.findFirst.mockResolvedValueOnce({ id: 'member-2', role: 'LAWYER', isActive: true });
    prisma.user.update.mockResolvedValue({});
    await service.deactivateMember('tenant-a', 'member-2');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'member-2' },
      data: {
        isActive: false,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('met à jour uniquement les champs fournis et signe le logo retourné', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-a' });
    prisma.tenant.update.mockResolvedValue({ id: 'tenant-a', name: 'Nouveau', logoUrl: 'logos/logo.png' });
    minio.getAssetUrl.mockResolvedValue('https://signed/logo.png');

    await expect(service.updateTenant('tenant-a', { name: 'Nouveau' }))
      .resolves.toEqual({ id: 'tenant-a', name: 'Nouveau', logoUrl: 'https://signed/logo.png' });
    expect(prisma.tenant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'tenant-a' }, data: { name: 'Nouveau' },
    }));
  });

  it('rejette un membre extérieur et applique une mise à jour partielle', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    await expect(service.updateMember('tenant-a', 'admin-1', 'foreign', { role: 'LAWYER' as any }))
      .rejects.toThrow(NotFoundException);

    prisma.user.findFirst.mockResolvedValueOnce({ id: 'member-1', role: 'LAWYER', isActive: true });
    prisma.user.update.mockResolvedValue({ id: 'member-1', role: 'ASSISTANT', isActive: true });
    await expect(service.updateMember('tenant-a', 'admin-1', 'member-1', { role: 'ASSISTANT' as any }))
      .resolves.toEqual({ id: 'member-1', role: 'ASSISTANT', isActive: true });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { role: 'ASSISTANT' },
    }));
  });

  it('autorise le retrait d’un administrateur lorsqu’un autre reste actif', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'admin-2', role: 'CABINET_ADMIN', isActive: true });
    prisma.user.count.mockResolvedValue(2);
    prisma.user.update.mockResolvedValue({ id: 'admin-2', role: 'LAWYER' });
    await service.updateMember('tenant-a', 'admin-1', 'admin-2', { role: 'LAWYER' as any });
    expect(prisma.user.count).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role: 'LAWYER' } }));
  });

  it('protège la désactivation administrative et les membres absents', async () => {
    prisma.user.findFirst.mockResolvedValueOnce(null);
    await expect(service.deactivateMember('tenant-a', 'missing')).rejects.toThrow(NotFoundException);

    prisma.user.findFirst.mockResolvedValueOnce({ id: 'admin-1', role: 'CABINET_ADMIN', isActive: true });
    prisma.user.count.mockResolvedValueOnce(1);
    await expect(service.deactivateMember('tenant-a', 'admin-1')).rejects.toThrow('at least one active administrator');

    prisma.user.findFirst.mockResolvedValueOnce({ id: 'admin-2', role: 'CABINET_ADMIN', isActive: true });
    prisma.user.count.mockResolvedValueOnce(2);
    prisma.user.update.mockResolvedValue({});
    await expect(service.deactivateMember('tenant-a', 'admin-2')).resolves.toEqual({ message: 'Member deactivated' });
  });

  it('rejette un tenant absent et met à jour tous les champs configurables', async () => {
    prisma.tenant.findUnique.mockResolvedValueOnce(null);
    await expect(service.updateTenant('missing', { name: 'X' })).rejects.toThrow(NotFoundException);

    prisma.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-a' });
    const dto = {
      name: 'Atlas', city: 'Yaoundé', country: 'Cameroun', address: 'Centre', phone: '600',
      fax: '601', website: 'https://atlas.test', siret: 'S1', barNumber: 'B1',
    };
    prisma.tenant.update.mockResolvedValue({ id: 'tenant-a', ...dto, logoUrl: 'logos/logo.png' });
    minio.getAssetUrl.mockRejectedValue(new Error('storage offline'));
    await expect(service.updateTenant('tenant-a', dto)).resolves.toEqual(expect.objectContaining({
      ...dto, logoUrl: 'logos/logo.png',
    }));
    expect(prisma.tenant.update).toHaveBeenCalledWith(expect.objectContaining({ data: dto }));
  });

  it('valide la présence, le type réel et la taille du logo', async () => {
    await expect(service.uploadLogo('tenant-a')).rejects.toThrow('Logo file is required');
    const detect = vi.spyOn(service as any, 'detectFileType');
    detect.mockResolvedValueOnce(undefined);
    const invalid = { buffer: Buffer.from('not an image'), size: 12 } as Express.Multer.File;
    await expect(service.uploadLogo('tenant-a', invalid)).rejects.toThrow('valid PNG, JPEG or WebP');

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    detect.mockResolvedValueOnce({ mime: 'image/png' });
    const oversized = { buffer: png, size: 2 * 1024 * 1024 + 1 } as Express.Multer.File;
    await expect(service.uploadLogo('tenant-a', oversized)).rejects.toThrow('under 2 MB');
  });

  it('stocke la clé du logo et retourne son URL signée ou null', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const file = { buffer: png, size: png.length, originalname: 'logo.png', mimetype: 'image/png' } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue({ mime: 'image/png' });
    minio.uploadFile.mockResolvedValue({ objectName: 'logos/object.png' });
    prisma.tenant.update.mockResolvedValue({ id: 'tenant-a', logoUrl: 'logos/object.png' });
    minio.getAssetUrl.mockResolvedValueOnce('https://signed/logo.png');
    await expect(service.uploadLogo('tenant-a', file)).resolves.toEqual({
      id: 'tenant-a', logoUrl: 'https://signed/logo.png',
    });
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-a' }, data: { logoUrl: 'logos/object.png' }, select: { id: true, logoUrl: true },
    });

    minio.getAssetUrl.mockRejectedValueOnce(new Error('offline'));
    await expect(service.uploadLogo('tenant-a', file)).resolves.toEqual({ id: 'tenant-a', logoUrl: null });
  });
});
