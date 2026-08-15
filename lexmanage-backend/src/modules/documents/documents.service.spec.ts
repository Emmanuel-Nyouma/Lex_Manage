import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const prisma: any = {
    document: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    case: { findFirst: vi.fn() },
  };
  const minio = {
    getPresignedUrl: vi.fn(),
    deleteFile: vi.fn(),
    uploadFile: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const n8n = {
    ingestDocument: vi.fn(),
    deleteDocumentVectors: vi.fn(),
  };
  const cache = { get: vi.fn(), set: vi.fn() };
  const malwareScanner = { assertClean: vi.fn() };
  const protection = {
    enabled: false,
    encrypt: vi.fn((value) => value),
    deepDecrypt: vi.fn((value) => value),
    searchTokens: vi.fn(() => []),
  };
  let service: DocumentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    cache.get.mockResolvedValue(null);
    service = new DocumentsService(
      prisma,
      minio as any,
      audit as any,
      n8n as any,
      cache as any,
      malwareScanner as any,
      protection as any,
    );
  });

  it('retourne directement une page mise en cache', async () => {
    const cached = { data: [{ id: 'doc-1' }], meta: { hasMore: false } };
    cache.get.mockResolvedValueOnce(3).mockResolvedValueOnce(cached);

    await expect(service.findAll('tenant-a', 'user-1', Role.LAWYER)).resolves.toBe(cached);
    expect(prisma.document.findMany).not.toHaveBeenCalled();
  });

  it('applique les permissions et la pagination cursor aux non-administrateurs', async () => {
    cache.get.mockResolvedValue(null);
    prisma.document.findMany.mockResolvedValue([
      { id: 'doc-3' },
      { id: 'doc-2' },
      { id: 'doc-1' },
    ]);

    const result = await service.findAll(
      'tenant-a',
      'user-1',
      Role.LAWYER,
      'cursor-1',
      2,
      'CONTRACT',
      ' contrat ',
    );

    expect(result).toEqual({
      data: [{ id: 'doc-3' }, { id: 'doc-2' }],
      meta: { limit: 2, nextCursor: 'doc-2', hasMore: true },
    });
    expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 3,
      cursor: { id: 'cursor-1' },
      skip: 1,
      where: expect.objectContaining({
        tenantId: 'tenant-a',
        deletedAt: null,
        category: 'CONTRACT',
        OR: expect.arrayContaining([
          { allowedRoles: { has: Role.LAWYER } },
          { uploaderId: 'user-1' },
        ]),
      }),
    }));
    expect(cache.set).toHaveBeenCalled();
  });

  it('refuse de créer un document lié à un dossier externe', async () => {
    prisma.case.findFirst.mockResolvedValue(null);

    await expect(service.create(
      {
        title: 'Contrat',
        fileName: 'contrat.pdf',
        fileUrl: 'object-key',
        fileType: 'application/pdf',
        fileSize: 100,
        category: 'CONTRACT',
        caseId: 'foreign-case',
      } as any,
      'tenant-a',
      'user-1',
    )).rejects.toThrow(BadRequestException);
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('analyse un upload avant de l’envoyer au stockage', async () => {
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/safe.txt' });
    minio.getPresignedUrl.mockResolvedValue('https://storage.example/signed');
    prisma.document.create.mockResolvedValue({
      id: 'doc-upload',
      file_url: 'documents/safe.txt',
      file_name: 'safe.txt',
    });
    n8n.ingestDocument.mockResolvedValue(undefined);
    const file = {
      originalname: 'safe.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('safe legal note'),
      size: 15,
    } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue(undefined);

    await service.upload(file, 'tenant-a', 'user-1', { pending: true });

    expect(malwareScanner.assertClean).toHaveBeenCalledWith(file.buffer);
    expect(malwareScanner.assertClean.mock.invocationCallOrder[0]).toBeLessThan(
      minio.uploadFile.mock.invocationCallOrder[0],
    );
  });

  it('crée, invalide le cache et journalise un document autorisé', async () => {
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.create.mockResolvedValue({ id: 'doc-1', case_id: 'case-1' });

    const result = await service.create(
      {
        title: 'Contrat',
        fileName: 'contrat.pdf',
        fileUrl: 'object-key',
        fileType: 'application/pdf',
        fileSize: 100,
        category: 'CONTRACT',
        caseId: 'case-1',
      } as any,
      'tenant-a',
      'user-1',
    );

    expect(result.id).toBe('doc-1');
    expect(cache.set).toHaveBeenCalledWith('documents:version:tenant-a', expect.any(Number), 300000);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CREATE',
      tenantId: 'tenant-a',
      entityId: 'doc-1',
    }));
  });

  it('refuse de lier un document inexistant même si le dossier est valide', async () => {
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(service.linkDocumentToCase(
      'missing-doc',
      'case-1',
      'tenant-a',
      'user-1',
    )).rejects.toThrow(NotFoundException);
  });

  it('annule le soft-delete si le nettoyage externe échoue', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-a',
      file_url: 'object-key',
      case_id: 'case-1',
    });
    prisma.document.update.mockResolvedValue({ id: 'doc-1' });
    n8n.deleteDocumentVectors.mockRejectedValue(new Error('n8n unavailable'));

    await expect(service.remove(
      'doc-1',
      'tenant-a',
      'user-1',
      Role.CABINET_ADMIN,
    )).rejects.toThrow('n8n unavailable');
    expect(prisma.document.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'doc-1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.document.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'doc-1' },
      data: { deletedAt: null },
    });
    expect(audit.log).not.toHaveBeenCalled();
  });
});
