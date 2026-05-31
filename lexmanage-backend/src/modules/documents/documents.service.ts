import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { MinioService } from './minio.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCase(caseId: string, tenantId: string) {
    return this.prisma.document.findMany({
      where: { caseId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(dto: CreateDocumentDto, tenantId: string, uploaderId: string) {
    const { category, ...data } = dto;
    return this.prisma.document.create({
      data: {
        ...data,
        tenantId,
        uploaderId,
      },
    });
  }

  async upload(
    file: Express.Multer.File | undefined,
    tenantId: string,
    uploaderId: string,
    options: { title?: string; caseId?: string; category?: string },
  ) {
    if (!file) throw new BadRequestException('File is required');

    if (options.caseId) {
      const targetCase = await this.prisma.case.findFirst({
        where: { id: options.caseId, tenantId },
        select: { id: true },
      });
      if (!targetCase) throw new NotFoundException('Case not found');
    }

    const { objectName } = await this.minio.uploadFile(file, tenantId);
    const document = await this.prisma.document.create({
      data: {
        tenantId,
        uploaderId,
        caseId: options.caseId,
        title: options.title || file.originalname,
        category: options.category,
        fileName: file.originalname,
        fileUrl: objectName,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });
    const signedUrl = await this.minio.getPresignedUrl(objectName);
    return { ...document, url: signedUrl };
  }

  async getSignedUrl(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    return { url: await this.minio.getPresignedUrl(this.toObjectName(doc.fileUrl)) };
  }

  async update(id: string, dto: UpdateDocumentDto, tenantId: string) {
    await this.findOne(id, tenantId);
    const { category, ...data } = dto;
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    await this.prisma.document.delete({ where: { id } });
    await this.minio.deleteFile(this.toObjectName(doc.fileUrl)).catch(() => undefined);
    return { message: 'Document deleted' };
  }

  private toObjectName(fileUrl: string) {
    if (!fileUrl.startsWith('http')) return fileUrl;
    const bucket = process.env.MINIO_BUCKET || 'lexmanage-documents';
    const marker = `/${bucket}/`;
    const index = fileUrl.indexOf(marker);
    if (index === -1) return fileUrl;
    return fileUrl.slice(index + marker.length);
  }
}
