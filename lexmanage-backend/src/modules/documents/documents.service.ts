import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.document.create({
      data: {
        ...dto,
        tenantId,
        uploaderId,
      },
    });
  }

  async update(id: string, dto: UpdateDocumentDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.document.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted' };
  }
}
