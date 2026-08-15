import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseDocumentsService } from './case-documents.service';

describe('CaseDocumentsService', () => {
  const prisma: any = {
    case: { findFirst: vi.fn() },
    document: { findFirst: vi.fn(), update: vi.fn() },
  };
  const protection = { deepDecrypt: vi.fn((value) => value) };
  let service: CaseDocumentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    protection.deepDecrypt.mockImplementation((value) => value);
    service = new CaseDocumentsService(prisma, protection as any);
  });

  it('lie uniquement un dossier et un document du même tenant puis déchiffre', async () => {
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
    prisma.document.update.mockResolvedValue({ id: 'doc-1', title: 'encrypted' });
    protection.deepDecrypt.mockReturnValue({ id: 'doc-1', title: 'Contrat' });

    await expect(service.link('case-1', 'doc-1', 'tenant-a'))
      .resolves.toEqual({ id: 'doc-1', title: 'Contrat' });
    expect(prisma.case.findFirst).toHaveBeenCalledWith({ where: { id: 'case-1', tenantId: 'tenant-a' } });
    expect(prisma.document.findFirst).toHaveBeenCalledWith({ where: { id: 'doc-1', tenantId: 'tenant-a' } });
  });

  it('rejette séparément un dossier ou un document étranger', async () => {
    prisma.case.findFirst.mockResolvedValue(null);
    prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
    await expect(service.link('foreign', 'doc-1', 'tenant-a')).rejects.toThrow(NotFoundException);

    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.findFirst.mockResolvedValue(null);
    await expect(service.link('case-1', 'foreign', 'tenant-a')).rejects.toThrow('Document not found');
  });

  it('délie uniquement le document rattaché au dossier demandé', async () => {
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.update.mockResolvedValue({ id: 'doc-1', case_id: null });
    await service.unlink('case-1', 'doc-1', 'tenant-a');
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1', case_id: 'case-1' }, data: { case_id: null },
    });

    prisma.case.findFirst.mockResolvedValue(null);
    await expect(service.unlink('foreign', 'doc-1', 'tenant-a')).rejects.toThrow('Case not found');
  });
});
