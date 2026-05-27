import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(tenantId: string, query: string) {
    if (!query || query.length < 2) return { cases: [], documents: [], members: [] };

    const [cases, documents, members] = await Promise.all([
      this.prisma.case.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { clientName: { contains: query, mode: 'insensitive' } },
            { caseNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, clientName: true, caseNumber: true, status: true },
      }),
      this.prisma.document.findMany({
        where: {
          tenantId,
          title: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, title: true, fileName: true, fileType: true },
      }),
      this.prisma.user.findMany({
        where: {
          tenantId,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
      }),
    ]);

    return { cases, documents, members };
  }
}
