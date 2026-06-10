import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(tenantId: string, query: string) {
    if (!query || query.length < 2) return { cases: [], documents: [], members: [], clients: [] };

    // Hybrid approach: run both exact-contains AND token-split matches,
    // then deduplicate by id so partial-word and full-phrase both surface.
    const tokens = query.trim().split(/\s+/).filter(Boolean);

    const caseWhere = (q: string) => ({
      tenantId,
      OR: [
        { title:      { contains: q, mode: 'insensitive' as const } },
        { clientName: { contains: q, mode: 'insensitive' as const } },
        { caseNumber: { contains: q, mode: 'insensitive' as const } },
        { description:{ contains: q, mode: 'insensitive' as const } },
      ],
    });

    const docWhere = (q: string) => ({
      tenantId,
      OR: [
        { title:     { contains: q, mode: 'insensitive' as const } },
        { file_name: { contains: q, mode: 'insensitive' as const } },
        { category:  { contains: q, mode: 'insensitive' as const } },
      ],
    });

    const memberWhere = (q: string) => ({
      tenantId,
      OR: [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName:  { contains: q, mode: 'insensitive' as const } },
        { email:     { contains: q, mode: 'insensitive' as const } },
      ],
    });

    const clientWhere = (q: string) => ({
      tenantId,
      OR: [
        { name:    { contains: q, mode: 'insensitive' as const } },
        { email:   { contains: q, mode: 'insensitive' as const } },
        { phone:   { contains: q, mode: 'insensitive' as const } },
        { address: { contains: q, mode: 'insensitive' as const } },
      ],
    });

    const queries = [query, ...tokens];

    const [caseSets, docSets, memberSets, clientSets] = await Promise.all([
      Promise.all(queries.map(q => this.prisma.case.findMany({
        where: caseWhere(q), take: 8,
        select: { id: true, title: true, clientName: true, caseNumber: true, status: true },
      }))),
      Promise.all(queries.map(q => this.prisma.document.findMany({
        where: docWhere(q), take: 8,
        select: { id: true, title: true, file_name: true, file_type: true, category: true },
      }))),
      Promise.all(queries.map(q => this.prisma.user.findMany({
        where: memberWhere(q), take: 5,
        select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
      }))),
      Promise.all(queries.map(q => this.prisma.client.findMany({
        where: clientWhere(q), take: 5,
        select: { id: true, name: true, email: true, phone: true, type_client: true },
      }))),
    ]);

    const dedup = <T extends { id: string }>(sets: T[][]): T[] => {
      const seen = new Set<string>();
      return sets.flat().filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }).slice(0, 6);
    };

    return {
      cases:    dedup(caseSets),
      documents:dedup(docSets),
      members:  dedup(memberSets),
      clients:  dedup(clientSets),
    };
  }
}
