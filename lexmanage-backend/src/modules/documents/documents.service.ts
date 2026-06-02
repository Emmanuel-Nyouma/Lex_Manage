import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentType } from './dto/document.dto';
import { MinioService } from './minio.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        cases: true
      }
    });
  }

  async findByCase(caseId: string, tenantId: string) {
    return this.prisma.document.findMany({
      where: { 
        tenantId,
        case_id: caseId
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        cases: true
      }
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(dto: CreateDocumentDto, tenantId: string, uploaderId: string) {
    const { caseId, ...data } = dto;
    
    const doc = await this.prisma.document.create({
      data: {
        title: data.title || 'Sans titre',
        file_name: data.fileName || 'unknown',
        file_url: data.fileUrl || '',
        file_type: data.fileType || 'application/octet-stream',
        file_size: data.fileSize || 0,
        category: data.category,
        tenantId,
        uploaderId,
        case_id: caseId,
      },
    });

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
    options: { name?: string; caseId?: string; documentType?: string; category?: string; courtCaseRef?: string; pending?: boolean },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > 50 * 1024 * 1024) throw new BadRequestException('File too large (max 50MB)');

    // Magic byte validation
    const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<any>);
    const type = await fileTypeFromBuffer(file.buffer);
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (!type || !allowedMimes.includes(type.mime)) {
      throw new BadRequestException(`Invalid file type: ${type?.mime || 'unknown'}`);
    }

    // New path structure: documents/{year}/{month}/{cuid()}/{original-filename}
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    // Using simple unique ID for now instead of CUID
    const cuid = uuidv4().slice(0, 8); 
    const pathPrefix = `documents/${year}/${month}/${cuid}/`;
    
    const { objectName } = await this.minio.uploadFile(file, tenantId, pathPrefix);
    
    const document = await this.prisma.document.create({
      data: {
        tenantId,
        uploaderId,
        title: options.name || file.originalname,
        file_name: file.originalname,
        file_url: objectName,
        file_type: type.mime,
        file_size: file.size,
        category: options.category || options.documentType,
        // Only associate if not pending
        case_id: options.pending ? null : options.caseId,
        isPending: !!options.pending,
      },
    });

    await this.auditService.log({
      tenantId,
      userId: uploaderId,
      action: 'UPLOAD',
      entity: 'Document',
      entityId: document.id,
      details: { after: document, pending: options.pending },
    });

    const signedUrl = await this.minio.getPresignedUrl(tenantId, objectName);
    return { ...document, url: signedUrl };
  }

  async getSignedUrl(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    return { url: await this.minio.getPresignedUrl(tenantId, doc.file_url) };
  }

  async update(id: string, dto: UpdateDocumentDto, tenantId: string, userId: string) {
    const original = await this.findOne(id, tenantId);
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title,
        category: dto.category,
        type: dto.type,
        status: dto.status,
      },
    });

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
  const doc = await this.prisma.document.update({
    where: { id: documentId, tenantId },
    data: { case_id: caseId },
  });

  await this.auditService.log({
    tenantId,
    userId,
    action: 'UPDATE',
    entity: 'Document',
    entityId: documentId,
    details: { action: 'LINK_TO_CASE', caseId },
  });

  return doc;
}

async remove(id: string, tenantId: string, userId: string) {
  const original = await this.findOne(id, tenantId);
  await this.prisma.document.delete({ where: { id } });
  await this.minio.deleteFile(tenantId, original.file_url).catch(() => undefined);

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

