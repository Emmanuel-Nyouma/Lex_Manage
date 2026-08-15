import { BadRequestException, Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { MinioService } from './minio.service';
import { AuditService } from '../audit/audit.service';
import { N8nRagService } from '../ai/n8n-rag.service';
import { MalwareScannerService } from './malware-scanner.service';
import { DataProtectionService } from '../security/data-protection.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private auditService: AuditService,
    private n8nRag: N8nRagService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private malwareScanner: MalwareScannerService,
    private protection: DataProtectionService,
  ) {}

  async findAll(
    tenantId: string,
    userId: string,
    role: Role,
    cursor?: string,
    limit: number = 10,
    category?: string,
    query?: string,
  ) {
    const normalizedQuery = query?.trim().slice(0, 200) || '';
    const cacheVersion = await this.getCacheVersion(tenantId);
    const cacheKey = `documents:${tenantId}:v${cacheVersion}:${userId}:${role}:cursor:${cursor || 'start'}:${limit}:${category || 'ALL'}:q:${normalizedQuery}`;
    const cached = (await this.cacheManager.get(cacheKey)) as any;
    if (cached) return cached;

    const where: any = this.accessWhere(tenantId, userId, role);
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (normalizedQuery) {
      const queryTokens = this.protection.searchTokens([normalizedQuery]);
      if (this.protection.enabled && queryTokens.length === 0) {
        where.id = '__no_matching_search_token__';
      }
      where.AND = [
        {
          OR: this.protection.enabled
            ? [
                { searchTokens: { hasEvery: queryTokens } },
                { title: { contains: normalizedQuery, mode: 'insensitive' } },
                { file_name: { contains: normalizedQuery, mode: 'insensitive' } },
                { category: { contains: normalizedQuery, mode: 'insensitive' } },
              ]
            : [
                { title: { contains: normalizedQuery, mode: 'insensitive' } },
                { file_name: { contains: normalizedQuery, mode: 'insensitive' } },
                { category: { contains: normalizedQuery, mode: 'insensitive' } },
              ],
        },
      ];
    }

    // Fetch limit + 1 to detect whether more items exist beyond this page.
    // Prisma's native cursor + skip:1 continues correctly under the compound orderBy.
    const rawData = await this.prisma.document.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        cases: true
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const data = this.protection.deepDecrypt(rawData);
    const hasMore = data.length > limit;
    const pageItems = hasMore ? data.slice(0, limit) : data;
    const result = {
      data: pageItems,
      meta: {
        limit,
        nextCursor: hasMore ? pageItems[pageItems.length - 1].id : null,
        hasMore,
      },
    };

    await this.cacheManager.set(cacheKey, result, 30000);
    return result;
  }

  async findByCase(caseId: string, tenantId: string, userId: string, role: Role) {
    const targetCase = await this.prisma.case.findFirst({
      where: { id: caseId, tenantId },
      select: { id: true },
    });
    if (!targetCase) throw new NotFoundException('Case not found');

    const cacheVersion = await this.getCacheVersion(tenantId);
    const cacheKey = `documents:${tenantId}:v${cacheVersion}:${userId}:${role}:case:${caseId}`;
    const cached = (await this.cacheManager.get(cacheKey)) as any;
    if (cached) return cached;

    const rawDocs = await this.prisma.document.findMany({
      where: {
        ...this.accessWhere(tenantId, userId, role),
        case_id: caseId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const docs = this.protection.deepDecrypt(rawDocs);
    await this.cacheManager.set(cacheKey, docs, 30000);
    return docs;
  }

  async findOne(id: string, tenantId: string, userId: string, role: Role) {
    const cacheVersion = await this.getCacheVersion(tenantId);
    const cacheKey = `document:${tenantId}:v${cacheVersion}:${userId}:${role}:${id}`;
    const cached = (await this.cacheManager.get(cacheKey)) as any;
    if (cached) return cached;

    const rawDoc = await this.prisma.document.findFirst({
      where: { id, ...this.accessWhere(tenantId, userId, role) },
      include: {
        cases: true
      }
    });
    if (!rawDoc) throw new NotFoundException('Document not found');
    const doc = this.protection.deepDecrypt(rawDoc);

    await this.cacheManager.set(cacheKey, doc, 60000); // 1 minute cache
    return doc;
  }

  private async invalidateDocumentCache(tenantId: string, _caseId?: string | null) {
    await this.cacheManager.set(`documents:version:${tenantId}`, Date.now(), 300000);
  }

  private async getCacheVersion(tenantId: string) {
    return (await this.cacheManager.get<number>(`documents:version:${tenantId}`)) || 1;
  }

  private accessWhere(tenantId: string, userId: string, role: Role) {
    const base: any = { tenantId, deletedAt: null };
    if (role === 'CABINET_ADMIN' || role === 'SUPER_ADMIN') return base;
    return {
      ...base,
      OR: [
        { allowedRoles: { isEmpty: true } },
        { allowedRoles: { has: role } },
        { uploaderId: userId },
      ],
    };
  }

  private async assertCaseOwnership(caseId: string | undefined, tenantId: string) {
    if (!caseId) return;
    const targetCase = await this.prisma.case.findFirst({
      where: { id: caseId, tenantId },
      select: { id: true },
    });
    if (!targetCase) throw new BadRequestException('Case does not belong to this firm');
  }

  async create(dto: CreateDocumentDto, tenantId: string, uploaderId: string) {
    const { caseId, ...data } = dto;
    await this.assertCaseOwnership(caseId, tenantId);
    
    const rawDoc = await this.prisma.document.create({
      data: {
        title: this.protection.encrypt(data.title || 'Sans titre') as string,
        file_name: this.protection.encrypt(data.fileName || 'unknown') as string,
        file_url: data.fileUrl || '',
        file_type: data.fileType || 'application/octet-stream',
        file_size: data.fileSize || 0,
        category: data.category,
        tenantId,
        uploaderId,
        case_id: caseId,
        searchTokens: this.protection.searchTokens([data.title, data.fileName, data.category]),
      },
    });
    const doc = this.protection.deepDecrypt(rawDoc);

    await this.invalidateDocumentCache(tenantId, caseId);

    await this.auditService.log({
      tenantId,
      userId: uploaderId,
      action: 'CREATE',
      entity: 'Document',
      entityId: doc.id,
      details: { after: doc },
    });

    return doc;
  }

  async upload(
    file: Express.Multer.File | undefined,
    tenantId: string,
    uploaderId: string,
    options: { name?: string; caseId?: string; documentType?: string; category?: string; subCategory?: string; allowedRoles?: Role[]; courtCaseRef?: string; pending?: boolean },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > 50 * 1024 * 1024) throw new BadRequestException('File too large (max 50MB)');
    if (file.originalname.length > 255) throw new BadRequestException('File name is too long');
    this.assertUploadTextLengths(options);

    // Magic byte validation
    const type = await this.detectFileType(file.buffer);
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ];

    // TXT files have no magic bytes — file-type returns undefined, so we fall
    // back to the MIME type declared by the client.
    const isPlainText = !type && file.mimetype === 'text/plain';

    if (!isPlainText && (!type || !allowedMimes.includes(type.mime))) {
      throw new BadRequestException(`Invalid file type: ${type?.mime || file.mimetype || 'unknown'}`);
    }
    await this.malwareScanner.assertClean(file.buffer);
    await this.assertCaseOwnership(options.pending ? undefined : options.caseId, tenantId);

    // New path structure: documents/{year}/{month}/{cuid()}/{original-filename}
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    // Using simple unique ID for now instead of CUID
    const cuid = randomUUID().slice(0, 8);
    const pathPrefix = `documents/${year}/${month}/${cuid}/`;
    
    const { objectName } = await this.minio.uploadFile(file, tenantId, pathPrefix);
    
    let document;
    try {
      const rawDocument = await this.prisma.document.create({
        data: {
          tenantId,
          uploaderId,
          title: this.protection.encrypt(options.name || file.originalname) as string,
          file_name: this.protection.encrypt(file.originalname) as string,
          file_url: objectName,
          file_type: type?.mime || file.mimetype,
          file_size: file.size,
          category: options.category || options.documentType,
          subCategory: options.subCategory,
          allowedRoles: options.allowedRoles || [],
          case_id: options.pending ? null : options.caseId,
          isPending: !!options.pending,
          searchTokens: this.protection.searchTokens([
            options.name || file.originalname,
            file.originalname,
            options.category || options.documentType,
          ]),
        },
      });
      document = this.protection.deepDecrypt(rawDocument);
    } catch (error) {
      await this.minio.deleteFile(tenantId, objectName).catch((cleanupError) => {
        this.logger.error(`Could not compensate failed upload ${objectName}`, cleanupError as Error);
      });
      throw error;
    }

    await this.invalidateDocumentCache(tenantId, options.pending ? null : options.caseId);

    await this.auditService.log({
      tenantId,
      userId: uploaderId,
      action: 'UPLOAD',
      entity: 'Document',
      entityId: document.id,
      details: { after: document, pending: options.pending },
    });

    // Sync to the n8n Legal RAG knowledge base (tenant-scoped, fire-and-forget).
    const N8N_INGESTABLE = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const effectiveMime = type?.mime || file.mimetype;
    if (N8N_INGESTABLE.includes(effectiveMime)) {
      void this.n8nRag.ingestDocument({
        tenantId,
        userId: uploaderId,
        documentId: document.id,
        filename: file.originalname,
        buffer: file.buffer,
        caseId: options.pending ? null : options.caseId,
      }).catch(async (error) => {
        this.logger.error(`Automatic RAG ingestion failed for ${document.id}`, error as Error);
        await this.prisma.document.update({
          where: { id: document.id },
          data: { status: 'ERROR' },
        }).catch(() => undefined);
      });
    }

    const signedUrl = await this.minio.getPresignedUrl(tenantId, objectName);
    return { ...document, url: signedUrl };
  }

  private assertUploadTextLengths(options: {
    name?: string;
    category?: string;
    subCategory?: string;
    courtCaseRef?: string;
  }) {
    const limits: Array<[string, string | undefined, number]> = [
      ['name', options.name, 200],
      ['category', options.category, 100],
      ['subCategory', options.subCategory, 100],
      ['courtCaseRef', options.courtCaseRef, 100],
    ];
    for (const [field, value, max] of limits) {
      if (value && value.length > max) {
        throw new BadRequestException(`${field} must not exceed ${max} characters`);
      }
    }
  }

  private async detectFileType(buffer: Buffer) {
    const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<any>);
    return fileTypeFromBuffer(buffer);
  }

  async getSignedUrl(id: string, tenantId: string, userId: string, role: Role) {
    const doc = await this.findOne(id, tenantId, userId, role);
    return { url: await this.minio.getPresignedUrl(tenantId, doc.file_url) };
  }

  async update(id: string, dto: UpdateDocumentDto, tenantId: string, userId: string, role: Role) {
    const original = await this.findOne(id, tenantId, userId, role);
    const rawUpdated = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title === undefined ? undefined : this.protection.encrypt(dto.title),
        category: dto.category,
        type: dto.type,
        status: dto.status,
        searchTokens: this.protection.searchTokens([
          dto.title ?? original.title,
          original.file_name,
          dto.category ?? original.category,
        ]),
      },
    });
    const updated = this.protection.deepDecrypt(rawUpdated);

    await this.invalidateDocumentCache(tenantId, original.case_id);

    await this.auditService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Document',
      entityId: id,
      details: { before: original, after: updated },
    });

    return updated;
  }

async linkDocumentToCase(documentId: string, caseId: string, tenantId: string, userId: string) {
  await this.assertCaseOwnership(caseId, tenantId);
  const existing = await this.prisma.document.findFirst({
    where: { id: documentId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new NotFoundException('Document not found');
  const doc = await this.prisma.document.update({
    where: { id: documentId },
    data: { case_id: caseId },
  });

  await this.invalidateDocumentCache(tenantId, caseId);

  await this.auditService.log({
    tenantId,
    userId,
    action: 'UPDATE',
    entity: 'Document',
    entityId: documentId,
    details: { action: 'LINK_TO_CASE', caseId },
  });

  return this.protection.deepDecrypt(doc);
}

async remove(id: string, tenantId: string, userId: string, role: Role) {
  const original = await this.findOne(id, tenantId, userId, role);
  await this.prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  try {
    await this.n8nRag.deleteDocumentVectors({ tenantId, documentId: id });
    await this.minio.deleteFile(tenantId, original.file_url);
  } catch (error) {
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: null },
    });
    throw error;
  }

  await this.invalidateDocumentCache(tenantId, original.case_id);

  await this.auditService.log({
    tenantId,
    userId,
    action: 'DELETE',
    entity: 'Document',
    entityId: id,
    details: { before: original },
  });

  return { message: 'Document deleted' };
}
}
