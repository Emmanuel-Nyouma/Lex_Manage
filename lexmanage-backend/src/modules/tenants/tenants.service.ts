import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { 
        _count: { select: { users: true, cases: true, documents: true } } 
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getMyTenant(tenantId: string) {
    return this.findOne(tenantId);
  }

  async getMembers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async createInvitation(tenantId: string, email: string, role: any) {
    const token = uuidv4().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        role,
        token,
        expiresAt,
      },
    });
  }

  async getInvitations(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(tenantId: string, id: string) {
    const invite = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });
    if (!invite) throw new NotFoundException('Invitation not found');

    await this.prisma.invitation.delete({ where: { id } });
    return { message: 'Invitation revoked' };
  }
}
