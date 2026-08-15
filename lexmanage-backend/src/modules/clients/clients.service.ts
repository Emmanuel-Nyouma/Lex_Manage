import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientDto } from './dto/client.dto';
import { AuditService } from '../audit/audit.service';
import { DataProtectionService } from '../security/data-protection.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private protection: DataProtectionService,
  ) {}

  async findAll(tenantId: string) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return this.protection
      .deepDecrypt(clients)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async findOne(id: string, tenantId: string) {
    const rawClient = await this.prisma.client.findFirst({
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
    if (!rawClient) throw new NotFoundException('Client not found');
    return this.protection.deepDecrypt(rawClient);
  }

  async create(dto: any, tenantId: string, userId: string) {
    const { caseId, deadlineId, ...clientData } = dto;

    const client = await this.prisma.$transaction(async (tx) => {
      const protectedData = {
        ...clientData,
        name: this.protection.encrypt(clientData.name),
        email: this.protection.encrypt(clientData.email),
        phone: this.protection.encrypt(clientData.phone),
        address: this.protection.encrypt(clientData.address),
        searchTokens: this.protection.searchTokens([
          clientData.name,
          clientData.email,
          clientData.phone,
          clientData.address,
        ]),
      };
      const newClient = await tx.client.create({ data: { ...protectedData, tenantId } });

      // Resolve caseId: either direct or via deadline's case
      let resolvedCaseId: string | null = caseId ?? null;
      if (!resolvedCaseId && deadlineId) {
        const deadline = await tx.deadline.findFirst({ where: { id: deadlineId, tenantId } });
        resolvedCaseId = deadline?.caseId ?? null;
      }

      if (resolvedCaseId) {
        const targetCase = await tx.case.findFirst({
          where: { id: resolvedCaseId, tenantId },
          select: { id: true },
        });
        if (!targetCase) {
          throw new NotFoundException('Case not found in your firm');
        }
        await tx.case.update({
          where: { id: resolvedCaseId },
          data: { clientId: newClient.id },
        });
      }

      return this.protection.deepDecrypt(newClient);
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
    const protectedDto = {
      ...dto,
      ...(dto.name !== undefined ? { name: this.protection.encrypt(dto.name) } : {}),
      ...(dto.email !== undefined ? { email: this.protection.encrypt(dto.email) } : {}),
      ...(dto.phone !== undefined ? { phone: this.protection.encrypt(dto.phone) } : {}),
      ...(dto.address !== undefined ? { address: this.protection.encrypt(dto.address) } : {}),
      searchTokens: this.protection.searchTokens([
        dto.name ?? original.name,
        dto.email ?? original.email,
        dto.phone ?? original.phone,
        dto.address ?? original.address,
      ]),
    };
    const rawUpdated = await this.prisma.client.update({
      where: { id },
      data: protectedDto,
    });
    const updated = this.protection.deepDecrypt(rawUpdated);

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
    await this.prisma.$transaction(async (tx) => {
      await tx.case.updateMany({
        where: { tenantId, clientId: id },
        data: { clientId: null },
      });
      await tx.client.delete({ where: { id } });
    });

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
