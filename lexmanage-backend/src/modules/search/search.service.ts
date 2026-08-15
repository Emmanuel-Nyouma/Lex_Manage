import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { DataProtectionService } from '../security/data-protection.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private protection: DataProtectionService,
  ) {}

  async globalSearch(tenantId: string, userId: string, role: Role, query: string) {
    const normalized = query?.trim() || '';
    if (normalized.length < 2) return { cases: [], documents: [], members: [], clients: [] };
    if (normalized.length > 200) throw new BadRequestException('Search query is too long');

    // Hybrid approach: run both exact-contains AND token-split matches,
    // then deduplicate by id so partial-word and full-phrase both surface.
    const terms = Array.from(new Set([normalized, ...normalized.split(/\s+/)])).slice(0, 9);

    const queryTokens = this.protection.searchTokens([normalized]);
    if (this.protection.enabled && queryTokens.length === 0) {
      return { cases: [], documents: [], members: [], clients: [] };
    }
    const caseWhere = {
      tenantId,
      ...(this.protection.enabled
        ? {
            OR: [
              { searchTokens: { hasEvery: queryTokens } },
              ...terms.flatMap((q) => [
                { title: { contains: q, mode: 'insensitive' as const } },
                { clientName: { contains: q, mode: 'insensitive' as const } },
                { caseNumber: { contains: q, mode: 'insensitive' as const } },
                { description: { contains: q, mode: 'insensitive' as const } },
              ]),
            ],
          }
        : {
            OR: terms.flatMap((q) => [
              { title: { contains: q, mode: 'insensitive' as const } },
              { clientName: { contains: q, mode: 'insensitive' as const } },
              { caseNumber: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ]),
          }),
    };

    const docWhere: any = {
      tenantId,
      deletedAt: null,
      AND: [
        {
              OR: this.protection.enabled
            ? [
                { searchTokens: { hasEvery: queryTokens } },
                ...terms.flatMap((q) => [
                  { title: { contains: q, mode: 'insensitive' as const } },
                  { file_name: { contains: q, mode: 'insensitive' as const } },
                ]),
                ...terms.map((q) => ({
                  category: { contains: q, mode: 'insensitive' as const },
                })),
              ]
            : terms.flatMap((q) => [
                { title: { contains: q, mode: 'insensitive' as const } },
                { file_name: { contains: q, mode: 'insensitive' as const } },
                { category: { contains: q, mode: 'insensitive' as const } },
              ]),
        },
      ],
    };
    if (role !== 'CABINET_ADMIN' && role !== 'SUPER_ADMIN') {
      docWhere.AND.push({
        OR: [
          { allowedRoles: { isEmpty: true } },
          { allowedRoles: { has: role } },
          { uploaderId: userId },
        ],
      });
    }

    const memberWhere = {
      tenantId,
      OR: terms.flatMap((q) => [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ]),
    };

    const clientWhere = {
      tenantId,
      ...(this.protection.enabled
        ? {
            OR: [
              { searchTokens: { hasEvery: queryTokens } },
              ...terms.flatMap((q) => [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
                { phone: { contains: q, mode: 'insensitive' as const } },
                { address: { contains: q, mode: 'insensitive' as const } },
              ]),
            ],
          }
        : {
            OR: terms.flatMap((q) => [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q, mode: 'insensitive' as const } },
              { address: { contains: q, mode: 'insensitive' as const } },
            ]),
          }),
    };

    const [cases, documents, members, clients] = await Promise.all([
      this.prisma.case.findMany({
        where: caseWhere, take: 6,
        select: { id: true, title: true, clientName: true, caseNumber: true, status: true },
      }),
      this.prisma.document.findMany({
        where: docWhere, take: 6,
        select: { id: true, title: true, file_name: true, file_type: true, category: true },
      }),
      this.prisma.user.findMany({
        where: memberWhere, take: 6,
        select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
      }),
      this.prisma.client.findMany({
        where: clientWhere, take: 6,
        select: { id: true, name: true, email: true, phone: true, type_client: true },
      }),
    ]);

    return {
      cases: this.protection.deepDecrypt(cases),
      documents: this.protection.deepDecrypt(documents),
      members,
      clients: this.protection.deepDecrypt(clients),
    };
  }
}
