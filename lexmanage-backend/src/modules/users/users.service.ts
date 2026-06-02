import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, avatarUrl: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, avatarUrl: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, tenantId: string, userId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const { password, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { ...rest, passwordHash, tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string, userId: string) {
    const original = await this.findOne(id, tenantId); // Ownership check
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, avatarUrl: true,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      details: { before: original, after: updated },
    });

    return updated;
  }

  async deactivate(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: id,
    });

    return { message: 'User deactivated' };
  }
}
