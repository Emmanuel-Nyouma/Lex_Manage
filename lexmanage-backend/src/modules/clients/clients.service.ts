import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.client.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { documents: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: any, tenantId: string, userId: string) {
    const { caseId, deadlineId, ...clientData } = dto;

    const client = await this.prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({ data: { ...clientData, tenantId } });

      // Resolve caseId: either direct or via deadline's case
      let resolvedCaseId: string | null = caseId ?? null;
      if (!resolvedCaseId && deadlineId) {
        const deadline = await tx.deadline.findFirst({ where: { id: deadlineId, tenantId } });
        resolvedCaseId = deadline?.caseId ?? null;
      }

      if (resolvedCaseId) {
        await tx.case.update({
          where: { id: resolvedCaseId },
          data: { clientId: newClient.id },
        });
      }

      return newClient;
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'CREATE', entity: 'Client', entityId: client.id,
      details: { after: client, linkedCaseId: caseId, linkedDeadlineId: deadlineId },
    });

    return client;
  }

  async update(id: string, dto: UpdateClientDto, tenantId: string, userId: string) {
    const original = await this.findOne(id, tenantId);
    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Client',
      entityId: id,
      details: { before: original, after: updated },
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string) {
    const original = await this.findOne(id, tenantId);
    await this.prisma.client.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'DELETE',
      entity: 'Client',
      entityId: id,
      details: { before: original },
    });

    return { message: 'Client deleted' };
  }
}
