import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const prisma: any = {
    case: { findMany: vi.fn() },
    document: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    client: { findMany: vi.fn() },
  };
  const protection: any = {
    enabled: false,
    searchTokens: vi.fn(() => []),
    deepDecrypt: vi.fn((value) => value),
  };
  let service: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    protection.enabled = false;
    protection.searchTokens.mockReturnValue([]);
    protection.deepDecrypt.mockImplementation((value) => value);
    for (const model of Object.values(prisma) as any[]) model.findMany.mockResolvedValue([]);
    service = new SearchService(prisma, protection);
  });

  it('n’interroge pas la base pour une recherche trop courte', async () => {
    await expect(service.globalSearch('tenant-a', 'user-1', 'LAWYER' as any, ' a '))
      .resolves.toEqual({ cases: [], documents: [], members: [], clients: [] });
    expect(prisma.case.findMany).not.toHaveBeenCalled();
  });

  it('traite une recherche absente comme une chaîne vide', async () => {
    await expect(service.globalSearch('tenant-a', 'user-1', 'LAWYER' as any, undefined as any))
      .resolves.toEqual({ cases: [], documents: [], members: [], clients: [] });
  });

  it('rejette une recherche supérieure à 200 caractères', async () => {
    await expect(service.globalSearch('tenant-a', 'user-1', 'LAWYER' as any, 'x'.repeat(201)))
      .rejects.toThrow(BadRequestException);
  });

  it('applique le tenant et les ACL documentaires aux non-administrateurs', async () => {
    prisma.case.findMany.mockResolvedValue([{ id: 'case-1', title: 'Alpha' }]);
    prisma.document.findMany.mockResolvedValue([{ id: 'doc-1', title: 'Alpha' }]);
    prisma.user.findMany.mockResolvedValue([{ id: 'member-1' }]);
    prisma.client.findMany.mockResolvedValue([{ id: 'client-1', name: 'Alpha' }]);

    const result = await service.globalSearch('tenant-a', 'user-1', 'LAWYER' as any, 'Alpha dossier');

    expect(prisma.case.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a' }), take: 6,
    }));
    const documentQuery = prisma.document.findMany.mock.calls[0][0];
    expect(documentQuery.where.tenantId).toBe('tenant-a');
    expect(documentQuery.where.AND).toHaveLength(2);
    expect(documentQuery.where.AND[1].OR).toContainEqual({ uploaderId: 'user-1' });
    expect(result).toEqual({
      cases: [{ id: 'case-1', title: 'Alpha' }],
      documents: [{ id: 'doc-1', title: 'Alpha' }],
      members: [{ id: 'member-1' }],
      clients: [{ id: 'client-1', name: 'Alpha' }],
    });
    expect(protection.deepDecrypt).toHaveBeenCalledTimes(3);
  });

  it('ne limite pas les documents d’un administrateur', async () => {
    await service.globalSearch('tenant-a', 'admin-1', 'CABINET_ADMIN' as any, 'contrat');
    expect(prisma.document.findMany.mock.calls[0][0].where.AND).toHaveLength(1);
  });

  it('retourne vide si le chiffrement est actif sans jeton de recherche', async () => {
    protection.enabled = true;
    protection.searchTokens.mockReturnValue([]);
    await expect(service.globalSearch('tenant-a', 'user-1', 'LAWYER' as any, 'contrat'))
      .resolves.toEqual({ cases: [], documents: [], members: [], clients: [] });
    expect(prisma.document.findMany).not.toHaveBeenCalled();
  });

  it('ajoute les jetons aveugles lorsque le chiffrement est actif', async () => {
    protection.enabled = true;
    protection.searchTokens.mockReturnValue(['token-a']);
    await service.globalSearch('tenant-a', 'admin-1', 'SUPER_ADMIN' as any, 'contrat');
    expect(prisma.case.findMany.mock.calls[0][0].where.OR[0]).toEqual({
      searchTokens: { hasEvery: ['token-a'] },
    });
    expect(prisma.client.findMany.mock.calls[0][0].where.OR[0]).toEqual({
      searchTokens: { hasEvery: ['token-a'] },
    });
  });
});
