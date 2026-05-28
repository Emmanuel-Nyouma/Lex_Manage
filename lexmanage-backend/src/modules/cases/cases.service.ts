import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.case.findMany({
        where: { tenantId },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.case.count({ where: { tenantId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const c = await this.prisma.case.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  async create(dto: CreateCaseDto, tenantId: string, userId: string) {
    const newCase = await this.prisma.case.create({
      data: { ...dto, tenantId, assigneeId: dto.assigneeId || userId },
    });
    
    // Broadcast real-time event
    this.eventsGateway.sendToTenant(tenantId, 'case.created', newCase);
    
    return newCase;
  }

  async update(id: string, dto: UpdateCaseDto, tenantId: string) {
    await this.findOne(id, tenantId); // Ownership check
    const data: any = { ...dto };
    if (dto.status === 'CLOSED') data.closedAt = new Date();
    return this.prisma.case.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.case.delete({ where: { id } });
    return { message: 'Case deleted' };
  }
}
