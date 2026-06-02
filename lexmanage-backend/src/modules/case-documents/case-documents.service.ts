import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CaseDocumentsService {
  constructor(private prisma: PrismaService) {}

  async link(caseId: string, documentId: string, tenantId: string) {
    // Verify both belong to the tenant
    const [targetCase, targetDoc] = await Promise.all([
      this.prisma.case.findFirst({ where: { id: caseId, tenantId } }),
      this.prisma.document.findFirst({ where: { id: documentId, tenantId } }),
    ]);

    if (!targetCase) throw new NotFoundException('Case not found');
    if (!targetDoc) throw new NotFoundException('Document not found');

    return this.prisma.document.update({
      where: { id: documentId },
      data: { case_id: caseId },
    });
  }

  async unlink(caseId: string, documentId: string, tenantId: string) {
    const targetCase = await this.prisma.case.findFirst({ where: { id: caseId, tenantId } });
    if (!targetCase) throw new NotFoundException('Case not found');

    return this.prisma.document.update({
      where: { id: documentId, case_id: caseId },
      data: { case_id: null },
    });
  }
}
