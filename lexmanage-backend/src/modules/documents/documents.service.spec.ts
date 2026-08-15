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

  it('applique des valeurs sûres aux métadonnées de création absentes', async () => {
    prisma.document.create.mockImplementation(({ data }: any) => ({ id: 'doc-default', ...data }));
    const result: any = await service.create({} as any, 'tenant-a', 'user-1');
    expect(result).toEqual(expect.objectContaining({
      title: 'Sans titre', file_name: 'unknown', file_url: '',
      file_type: 'application/octet-stream', file_size: 0,
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

  it('retourne une page non mise en cache aux administrateurs', async () => {
    prisma.document.findMany.mockResolvedValue([{ id: 'doc-1' }]);
    await expect(service.findAll('tenant-a', 'admin-1', Role.CABINET_ADMIN, undefined, 10, 'ALL'))
      .resolves.toEqual({ data: [{ id: 'doc-1' }], meta: { limit: 10, nextCursor: null, hasMore: false } });
    expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a', deletedAt: null }, take: 11,
    }));
  });

  it('neutralise une recherche chiffrée sans jeton', async () => {
    protection.enabled = true;
    protection.searchTokens.mockReturnValue([]);
    prisma.document.findMany.mockResolvedValue([]);
    await service.findAll('tenant-a', 'user-1', Role.LAWYER, undefined, 10, undefined, 'x');
    expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: '__no_matching_search_token__' }),
    }));
    protection.enabled = false;
  });

  it('scope, met en cache et relit les documents d’un dossier', async () => {
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.document.findMany.mockResolvedValue([{ id: 'doc-1' }]);
    await expect(service.findByCase('case-1', 'tenant-a', 'user-1', Role.LAWYER))
      .resolves.toEqual([{ id: 'doc-1' }]);
    expect(cache.set).toHaveBeenCalledWith(expect.stringContaining(':case:case-1'), [{ id: 'doc-1' }], 30000);
    cache.get.mockReset().mockResolvedValueOnce(1).mockResolvedValueOnce([{ id: 'cached' }]);
    await expect(service.findByCase('case-1', 'tenant-a', 'user-1', Role.LAWYER))
      .resolves.toEqual([{ id: 'cached' }]);
  });

  it('rejette un dossier absent et un document inaccessible', async () => {
    prisma.case.findFirst.mockResolvedValue(null);
    await expect(service.findByCase('case-x', 'tenant-a', 'user-1', Role.LAWYER)).rejects.toThrow('Case not found');
    prisma.document.findFirst.mockResolvedValue(null);
    await expect(service.findOne('doc-x', 'tenant-a', 'user-1', Role.LAWYER)).rejects.toThrow('Document not found');
  });

  it('lit un document depuis la base puis depuis le cache et signe son URL', async () => {
    prisma.document.findFirst.mockResolvedValue({ id: 'doc-1', file_url: 'object-key' });
    minio.getPresignedUrl.mockResolvedValue('https://signed/doc');
    await expect(service.getSignedUrl('doc-1', 'tenant-a', 'user-1', Role.LAWYER))
      .resolves.toEqual({ url: 'https://signed/doc' });
    expect(cache.set).toHaveBeenCalledWith(expect.stringContaining('document:tenant-a'), expect.anything(), 60000);
    cache.get.mockReset().mockResolvedValueOnce(1).mockResolvedValueOnce({ id: 'cached', file_url: 'cached-key' });
    await expect(service.findOne('cached', 'tenant-a', 'user-1', Role.LAWYER)).resolves.toEqual({ id: 'cached', file_url: 'cached-key' });
  });

  it.each([
    [undefined, {}, 'File is required'],
    [{ originalname: 'x.pdf', mimetype: 'application/pdf', buffer: Buffer.from('x'), size: 51 * 1024 * 1024 }, {}, 'File too large'],
    [{ originalname: `${'x'.repeat(256)}.pdf`, mimetype: 'application/pdf', buffer: Buffer.from('x'), size: 1 }, {}, 'File name is too long'],
    [{ originalname: 'x.txt', mimetype: 'text/plain', buffer: Buffer.from('x'), size: 1 }, { name: 'x'.repeat(201) }, 'name must not exceed 200'],
    [{ originalname: 'x.txt', mimetype: 'text/plain', buffer: Buffer.from('x'), size: 1 }, { category: 'x'.repeat(101) }, 'category must not exceed 100'],
  ])('valide les limites d’upload', async (file, options, message) => {
    await expect(service.upload(file as any, 'tenant-a', 'user-1', options as any)).rejects.toThrow(message);
    expect(minio.uploadFile).not.toHaveBeenCalled();
  });

  it('rejette un type détecté non autorisé', async () => {
    const file = { originalname: 'evil.exe', mimetype: 'application/octet-stream', buffer: Buffer.from('MZ'), size: 2 } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue({ mime: 'application/x-msdownload' });
    await expect(service.upload(file, 'tenant-a', 'user-1', {})).rejects.toThrow('Invalid file type');
  });

  it.each([
    ['application/octet-stream', 'application/octet-stream'],
    ['', 'unknown'],
  ])('décrit un upload sans signature magique avec le type %j', async (mimetype, expected) => {
    const file = {
      originalname: 'unknown.bin', mimetype, buffer: Buffer.from('unknown'), size: 7,
    } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue(undefined);
    await expect(service.upload(file, 'tenant-a', 'user-1', {}))
      .rejects.toThrow(`Invalid file type: ${expected}`);
  });

  it('valide aussi les limites de sous-catégorie et référence judiciaire', async () => {
    const file = {
      originalname: 'safe.txt', mimetype: 'text/plain', buffer: Buffer.from('safe'), size: 4,
    } as Express.Multer.File;
    await expect(service.upload(file, 'tenant-a', 'user-1', { subCategory: 'x'.repeat(101) }))
      .rejects.toThrow('subCategory must not exceed 100');
    await expect(service.upload(file, 'tenant-a', 'user-1', { courtCaseRef: 'x'.repeat(101) }))
      .rejects.toThrow('courtCaseRef must not exceed 100');
  });

  it('termine un upload lié à un dossier et transmet ce dossier au RAG', async () => {
    const file = {
      originalname: 'evidence.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF'), size: 4,
    } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue({ mime: 'application/pdf' });
    prisma.case.findFirst.mockResolvedValue({ id: 'case-1' });
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/evidence.pdf' });
    minio.getPresignedUrl.mockResolvedValue('https://signed/evidence');
    prisma.document.create.mockResolvedValue({ id: 'doc-1', file_url: 'documents/evidence.pdf' });
    n8n.ingestDocument.mockResolvedValue(undefined);
    await service.upload(file, 'tenant-a', 'user-1', { caseId: 'case-1' });
    expect(n8n.ingestDocument).toHaveBeenCalledWith(expect.objectContaining({ caseId: 'case-1' }));
  });

  it('stocke une image valide sans tenter de l’indexer dans le RAG', async () => {
    const file = {
      originalname: 'evidence.png', mimetype: 'image/png', buffer: Buffer.from('png'), size: 3,
    } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue({ mime: 'image/png' });
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/evidence.png' });
    minio.getPresignedUrl.mockResolvedValue('https://signed/evidence');
    prisma.document.create.mockResolvedValue({ id: 'doc-image', file_url: 'documents/evidence.png' });
    await expect(service.upload(file, 'tenant-a', 'user-1', {}))
      .resolves.toEqual(expect.objectContaining({ id: 'doc-image' }));
    expect(n8n.ingestDocument).not.toHaveBeenCalled();
  });

  it('compense le stockage lorsque la création en base échoue', async () => {
    const file = { originalname: 'safe.txt', mimetype: 'text/plain', buffer: Buffer.from('safe'), size: 4 } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue(undefined);
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/safe.txt' });
    prisma.document.create.mockRejectedValue(new Error('database offline'));
    minio.deleteFile.mockRejectedValue(new Error('cleanup offline'));
    await expect(service.upload(file, 'tenant-a', 'user-1', {})).rejects.toThrow('database offline');
    expect(minio.deleteFile).toHaveBeenCalledWith('tenant-a', 'documents/safe.txt');
  });

  it('marque le document en erreur si l’ingestion RAG échoue', async () => {
    const file = { originalname: 'safe.txt', mimetype: 'text/plain', buffer: Buffer.from('safe'), size: 4 } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue(undefined);
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/safe.txt' });
    minio.getPresignedUrl.mockResolvedValue('https://signed/doc');
    prisma.document.create.mockResolvedValue({ id: 'doc-1', file_url: 'documents/safe.txt' });
    prisma.document.update.mockResolvedValue({});
    n8n.ingestDocument.mockRejectedValue(new Error('rag offline'));
    await expect(service.upload(file, 'tenant-a', 'user-1', { pending: true }))
      .resolves.toEqual(expect.objectContaining({ id: 'doc-1', url: 'https://signed/doc' }));
    await vi.waitFor(() => expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' }, data: { status: 'ERROR' },
    }));
  });

  it('tolère aussi une panne lors du marquage d’une ingestion RAG en erreur', async () => {
    const file = {
      originalname: 'safe.txt', mimetype: 'text/plain', buffer: Buffer.from('safe'), size: 4,
    } as Express.Multer.File;
    vi.spyOn(service as any, 'detectFileType').mockResolvedValue(undefined);
    minio.uploadFile.mockResolvedValue({ objectName: 'documents/safe.txt' });
    minio.getPresignedUrl.mockResolvedValue('https://signed/doc');
    prisma.document.create.mockResolvedValue({ id: 'doc-1', file_url: 'documents/safe.txt' });
    prisma.document.update.mockRejectedValue(new Error('database offline'));
    n8n.ingestDocument.mockRejectedValue(new Error('rag offline'));

    await expect(service.upload(file, 'tenant-a', 'user-1', { pending: true }))
      .resolves.toEqual(expect.objectContaining({ id: 'doc-1' }));
    await vi.waitFor(() => expect(prisma.document.update).toHaveBeenCalled());
  });

  it('détecte réellement le type MIME d’un document depuis ses octets', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    await expect((service as any).detectFileType(png))
      .resolves.toEqual(expect.objectContaining({ mime: 'image/png' }));
  });

  it('met à jour, lie et supprime un document avec audit', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1', title: 'Old', file_name: 'old.pdf', category: 'OLD', file_url: 'object-key', case_id: 'case-1',
    });
    prisma.document.update.mockResolvedValue({ id: 'doc-1', title: 'New', case_id: 'case-1' });
    await service.update('doc-1', { title: 'New', category: 'CONTRACT' } as any, 'tenant-a', 'user-1', Role.CABINET_ADMIN);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));

    prisma.case.findFirst.mockResolvedValue({ id: 'case-2' });
    prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
    await expect(service.linkDocumentToCase('doc-1', 'case-2', 'tenant-a', 'user-1'))
      .resolves.toEqual(expect.objectContaining({ id: 'doc-1' }));

    cache.get.mockResolvedValue(null);
    prisma.document.findFirst.mockResolvedValue({ id: 'doc-1', file_url: 'object-key', case_id: 'case-2' });
    n8n.deleteDocumentVectors.mockResolvedValue(undefined);
    minio.deleteFile.mockResolvedValue(undefined);
    await expect(service.remove('doc-1', 'tenant-a', 'user-1', Role.CABINET_ADMIN))
      .resolves.toEqual({ message: 'Document deleted' });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
  });

  it('préserve les valeurs recherchables pendant une mise à jour partielle', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1', title: 'Old', file_name: 'old.pdf', category: 'OLD', case_id: null,
    });
    prisma.document.update.mockResolvedValue({ id: 'doc-1', title: 'Old', category: 'OLD' });
    await service.update('doc-1', {} as any, 'tenant-a', 'user-1', Role.CABINET_ADMIN);
    expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ title: undefined }),
    }));
    expect(protection.searchTokens).toHaveBeenCalledWith(['Old', 'old.pdf', 'OLD']);
  });
});
