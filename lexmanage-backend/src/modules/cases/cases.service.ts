import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { DataProtectionService } from '../security/data-protection.service';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private protection: DataProtectionService,
  ) {}

  async findAll(tenantId: string, cursor?: string, limit: number = 10) {
    const cacheKey = `cases:${tenantId}:cursor:${cursor || 'start'}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Fetch limit + 1 to detect whether more items exist beyond this page.
    // Prisma's native cursor + skip:1 continues correctly under the compound orderBy.
    const rawData = await this.prisma.case.findMany({
      where: { tenantId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        client: true,
        _count: { select: { documents: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

  async findOne(id: string, tenantId: string) {
    const cacheKey = `case:${tenantId}:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const rawCase = await this.prisma.case.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        client: true,
        documents: { 
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    });
    if (!rawCase) throw new NotFoundException('Case not found');
    const c = this.protection.deepDecrypt(rawCase);

    await this.cacheManager.set(cacheKey, c, 60000); // 1 minute cache
    return c;
  }

  private async invalidateTenantCases(tenantId: string) {
    // Cursor pages are keyed by an unpredictable cursor, so we can only reliably
    // clear the first page (cursor = 'start') for common limits. That is the page
    // that reflects newly created / deleted cases (they appear at the top).
    // Deeper cursor pages expire on their own 30s TTL.
    const commonLimits = [10, 12, 20, 50, 100];
    for (const limit of commonLimits) {
      await this.cacheManager.del(`cases:${tenantId}:cursor:start:${limit}`);
    }
  }

  async create(dto: CreateCaseDto, tenantId: string, userId: string) {
    const { documentIds, ...data } = dto;
    await this.assertReferences(tenantId, dto.clientId, dto.assigneeId || userId);

    const protectedData = {
      ...data,
      title: this.protection.encrypt(data.title),
      description: this.protection.encrypt(data.description),
      clientName: this.protection.encrypt(data.clientName),
      courtName: this.protection.encrypt(data.courtName),
      caseNumber: this.protection.encrypt(data.caseNumber),
      searchTokens: this.protection.searchTokens([
        data.title,
        data.description,
        data.clientName,
        data.courtName,
        data.caseNumber,
      ]),
    };
    const rawCase = await this.prisma.$transaction(async (tx) => {
      const newCase = await tx.case.create({
        data: { ...protectedData, tenantId, assigneeId: dto.assigneeId || userId },
      });

      if (documentIds && documentIds.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: documentIds }, tenantId },
          data: { case_id: newCase.id, isPending: false },
        });
      }

      return newCase;
    });

    const newCase = this.protection.deepDecrypt(rawCase);
    await this.invalidateTenantCases(tenantId);
    await this.auditService.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Case',
      entityId: newCase.id,
      details: { after: newCase },
    });
    this.eventsGateway.sendToTenant(tenantId, 'case.created', newCase);
    return newCase;
  }

  async update(id: string, dto: UpdateCaseDto, tenantId: string, userId: string) {
    const originalCase: any = await this.findOne(id, tenantId); // Ownership check
    const { documentIds, ...data } = dto;
    await this.assertReferences(tenantId, dto.clientId, dto.assigneeId);
    const updateData: any = {
      ...data,
      ...(data.title !== undefined ? { title: this.protection.encrypt(data.title) } : {}),
      ...(data.description !== undefined
        ? { description: this.protection.encrypt(data.description) }
        : {}),
      ...(data.courtName !== undefined
        ? { courtName: this.protection.encrypt(data.courtName) }
        : {}),
      ...(data.caseNumber !== undefined
        ? { caseNumber: this.protection.encrypt(data.caseNumber) }
        : {}),
      searchTokens: this.protection.searchTokens([
        data.title ?? originalCase.title,
        data.description ?? originalCase.description,
        originalCase.clientName,
        data.courtName ?? originalCase.courtName,
        data.caseNumber ?? originalCase.caseNumber,
      ]),
    };
    if (dto.status) updateData.closedAt = dto.status === 'CLOSED' ? new Date() : null;

    const rawUpdatedCase = await this.prisma.$transaction(async (tx) => {
      const updatedCase = await tx.case.update({
        where: { id },
        data: updateData,
      });

      if (documentIds && documentIds.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: documentIds }, tenantId },
          data: { case_id: id },
        });
      }

      return updatedCase;
    });

    const updatedCase = this.protection.deepDecrypt(rawUpdatedCase);
    await this.cacheManager.del(`case:${tenantId}:${id}`);
    await this.invalidateTenantCases(tenantId);
    await this.auditService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Case',
      entityId: id,
      details: { before: originalCase, after: updatedCase },
    });
    return updatedCase;
  }

  private async assertReferences(
    tenantId: string,
    clientId?: string | null,
    assigneeId?: string | null,
  ) {
    const [client, assignee] = await Promise.all([
      clientId
        ? this.prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } })
        : null,
      assigneeId
        ? this.prisma.user.findFirst({
            where: { id: assigneeId, tenantId, isActive: true },
            select: { id: true },
          })
        : null,
    ]);
    if (clientId && !client) throw new BadRequestException('Client does not belong to this firm');
    if (assigneeId && !assignee) throw new BadRequestException('Assignee does not belong to this firm');
  }

  async remove(id: string, tenantId: string, userId: string) {
    const originalCase = await this.findOne(id, tenantId);
    await this.prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.document.updateMany({
          where: { tenantId, case_id: id },
          data: { case_id: null },
        }),
        tx.notification.updateMany({
          where: { tenantId, caseId: id },
          data: { caseId: null },
        }),
        tx.scheduledNotification.updateMany({
          where: { tenantId, caseId: id },
          data: { caseId: null },
        }),
      ]);
      await tx.case.delete({ where: { id } });
    });

    await this.cacheManager.del(`case:${tenantId}:${id}`);
    await this.invalidateTenantCases(tenantId);

    await this.auditService.log({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Case',
      entityId: id,
      details: { before: originalCase },
    });

    return { message: 'Case deleted' };
  }
}
