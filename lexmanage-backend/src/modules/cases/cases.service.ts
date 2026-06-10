import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    @InjectQueue('reminders') private reminderQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const cacheKey = `cases:${tenantId}:${page}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.case.findMany({
        where: { tenantId },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          client: true,
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.case.count({ where: { tenantId } }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, 30000); // 30 seconds cache for lists
    return result;
  }

  async findOne(id: string, tenantId: string) {
    const cacheKey = `case:${tenantId}:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const c = await this.prisma.case.findFirst({
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
    if (!c) throw new NotFoundException('Case not found');

    await this.cacheManager.set(cacheKey, c, 60000); // 1 minute cache
    return c;
  }

  private async invalidateTenantCases(tenantId: string) {
    // Clear the most common first page results for different limit options
    const commonLimits = [10, 20, 50];
    const pagesToClear = 5;

    for (const limit of commonLimits) {
      for (let page = 1; page <= pagesToClear; page++) {
        await this.cacheManager.del(`cases:${tenantId}:${page}:${limit}`);
      }
    }
  }

  async create(dto: CreateCaseDto, tenantId: string, userId: string) {
    const { documentIds, ...data } = dto;
    
    return this.prisma.$transaction(async (tx) => {
      const newCase = await tx.case.create({
        data: { ...data, tenantId, assigneeId: dto.assigneeId || userId },
      });

      if (documentIds && documentIds.length > 0) {
        await tx.document.updateMany({
          where: { id: { in: documentIds }, tenantId },
          data: { case_id: newCase.id, isPending: false },
        });
      }

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
    });
  }

  async update(id: string, dto: UpdateCaseDto, tenantId: string, userId: string) {
    const originalCase = await this.findOne(id, tenantId); // Ownership check
    const { documentIds, ...data } = dto;
    const updateData: any = { ...data };
    if (dto.status === 'CLOSED') updateData.closedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
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
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    const originalCase = await this.findOne(id, tenantId);
    await this.prisma.case.delete({ where: { id } });

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
