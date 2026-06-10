import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(tenantId: string) {
    const cacheKey = `users:${tenantId}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, avatarUrl: true,
      },
    });

    await this.cacheManager.set(cacheKey, users, 60000); // 1 minute cache
    return users;
  }

  async findOne(id: string, tenantId: string) {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, avatarUrl: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.cacheManager.set(cacheKey, user, 300000); // 5 minutes cache
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

    await this.cacheManager.del(`users:${tenantId}`);

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

    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del(`users:${tenantId}`);

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

  async findColleagues(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatarUrl: true,
        cases: {
          where: { status: { notIn: ['CLOSED', 'ARCHIVED'] } },
          select: { id: true, title: true, status: true, priority: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { firstName: 'asc' },
    });
    return users;
  }

  async deactivate(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });

    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del(`users:${tenantId}`);

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
