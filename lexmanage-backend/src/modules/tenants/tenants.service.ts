import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from '../documents/minio.service';
import { v4 as uuidv4 } from 'uuid';

export interface UpdateTenantDto {
  name?: string;
  city?: string;
  country?: string;
  address?: string;
  phone?: string;
  fax?: string;
  website?: string;
  siret?: string;
  barNumber?: string;
}

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { 
        _count: { select: { users: true, cases: true, documents: true } },
        users: {
          select: { role: true }
        }
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Aggregate counts
    const roleStats = {
      admins: tenant.users.filter(u => u.role === 'CABINET_ADMIN' || u.role === 'SUPER_ADMIN').length,
      lawyers: tenant.users.filter(u => u.role === 'LAWYER').length,
      assistants: tenant.users.filter(u => u.role === 'ASSISTANT').length,
      secretaries: tenant.users.filter(u => u.role === 'SECRETARY').length,
    };

    const { users, ...rest } = tenant;
    return { ...rest, roleStats };
  }

  async getMyTenant(tenantId: string) {
    return this.findOne(tenantId);
  }

  async getMembers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
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

  async updateMember(tenantId: string, id: string, data: { role?: any; isActive?: boolean }) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found in your firm');

    // Build the update payload — only include defined fields to avoid
    // accidentally nullifying role when only isActive is being patched.
    const patch: Record<string, any> = {};
    if (data.role      !== undefined) patch.role     = data.role;
    if (data.isActive  !== undefined) patch.isActive = data.isActive;

    return this.prisma.user.update({
      where: { id },
      data: patch,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Soft-disable a member (sets isActive = false).
   * Hard deletion is intentionally not exposed via the API to prevent data loss.
   * A deactivated user cannot log in (auth.service checks isActive on login & token refresh).
   */
  async deactivateMember(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found in your firm');
    if (user.isActive === false) return { message: 'Member is already inactive' };

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        // Invalidate existing refresh token so the session ends immediately
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });
    return { message: 'Member deactivated' };
  }

  // ── Firm Info ──────────────────────────────────────────────────────

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name      !== undefined && { name: dto.name }),
        ...(dto.city      !== undefined && { city: dto.city }),
        ...(dto.country   !== undefined && { country: dto.country }),
        ...(dto.address   !== undefined && { address: dto.address }),
        ...(dto.phone     !== undefined && { phone: dto.phone }),
        ...(dto.fax       !== undefined && { fax: dto.fax }),
        ...(dto.website   !== undefined && { website: dto.website }),
        ...(dto.siret     !== undefined && { siret: dto.siret }),
        ...(dto.barNumber !== undefined && { barNumber: dto.barNumber }),
      },
      select: {
        id: true, name: true, slug: true, plan: true,
        country: true, city: true, address: true,
        phone: true, fax: true, website: true,
        siret: true, barNumber: true, logoUrl: true,
        isActive: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async uploadLogo(tenantId: string, file: Express.Multer.File) {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Logo must be PNG, JPEG, SVG or WebP');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Logo must be under 2 MB');
    }

    const { fileUrl } = await this.minioService.uploadFile(file, tenantId, 'logos/');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: fileUrl },
      select: { id: true, logoUrl: true },
    });
  }
}
