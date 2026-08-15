import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { tenantContext } from '../../common/context/tenant.context';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ... (register method)

  // ── REGISTER (Creates a new Tenant + Admin user OR Joins via Invitation) ─
  async register(dto: RegisterDto) {
    return tenantContext.runUnscoped(async () => {
      this.logger.debug('Registering new user');
      try {
        const normalizedEmail = this.normalizeEmail(dto.email);
        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
          if (existing) throw new ConflictException('Email already registered');

          let tenantId: string;
          let role: 'CABINET_ADMIN' | 'LAWYER' | 'ASSISTANT' | 'SECRETARY' = 'CABINET_ADMIN';

          if (dto.invitationToken) {
            this.logger.debug('Joining via invitation token');
            const invitation = await tx.invitation.findUnique({
              where: { token: dto.invitationToken },
              include: { tenant: { select: { isActive: true } } },
            });

            if (
              !invitation ||
              invitation.used ||
              invitation.expiresAt <= new Date() ||
              !invitation.tenant.isActive ||
              this.normalizeEmail(invitation.email) !== normalizedEmail
            ) {
              throw new UnauthorizedException('Invalid or expired invitation token');
            }

            const consumed = await tx.invitation.updateMany({
              where: {
                id: invitation.id,
                used: false,
                expiresAt: { gt: new Date() },
              },
              data: { used: true },
            });
            if (consumed.count !== 1) {
              throw new UnauthorizedException('Invitation already used');
            }

            tenantId = invitation.tenantId;
            role = invitation.role === 'SUPER_ADMIN' ? 'CABINET_ADMIN' : invitation.role;
          } else {
            if (!dto.tenantName?.trim()) {
              throw new ConflictException('Tenant name is required for new cabinets');
            }

            const slugBase = dto.tenantName
              .trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            const tenant = await tx.tenant.create({
              data: {
                name: dto.tenantName.trim(),
                slug: `${slugBase || 'cabinet'}-${randomUUID().slice(0, 6)}`,
                country: dto.country,
                city: dto.city,
              },
            });
            tenantId = tenant.id;
          }

          return tx.user.create({
            data: {
              tenantId,
              email: normalizedEmail,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone,
              role,
            },
          });
        });

        const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
        await this.storeRefreshToken(user.id, tokens.refreshToken);

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: this.sanitizeUser(user),
        };
      } catch (error) {
        this.logger.error('Registration failed', error);
        throw error;
      }
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });
    return this.sanitizeUser(user);
  }

  async requestPasswordReset(email: string) {
    return tenantContext.runUnscoped(async () => {
      const normalizedEmail = this.normalizeEmail(email);
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { tenant: { select: { isActive: true } } },
      });

      if (user?.isActive && user.tenant.isActive) {
        const token = randomBytes(32).toString('hex');
        const tokenHash = this.hashRefreshToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.$transaction([
          this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, usedAt: null },
          }),
          this.prisma.passwordResetToken.create({
            data: { tenantId: user.tenantId, userId: user.id, tokenHash, expiresAt },
          }),
        ]);

        const frontendUrl = (
          process.env.FRONTEND_URL ||
          process.env.ALLOWED_ORIGINS?.split(',')[0] ||
          ''
        ).replace(/\/$/, '');
        if (frontendUrl) {
          await this.mailService.sendPasswordResetEmail(
            user.email,
            `${frontendUrl}/login?mode=reset_password&token=${encodeURIComponent(token)}`,
          );
        } else {
          this.logger.error('FRONTEND_URL is not configured; password reset email was not sent');
        }
      }

      return { message: 'If an active account exists, a reset link has been sent.' };
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    return tenantContext.runUnscoped(async () => {
      const record = await this.prisma.passwordResetToken.findUnique({
        where: { tokenHash: this.hashRefreshToken(dto.token) },
        include: {
          user: { include: { tenant: { select: { isActive: true } } } },
        },
      });
      if (
        !record ||
        record.usedAt ||
        record.expiresAt <= new Date() ||
        !record.user.isActive ||
        !record.user.tenant.isActive
      ) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      const passwordHash = await bcrypt.hash(dto.newPassword, 12);
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash, refreshToken: null, refreshTokenExpiresAt: null },
        }),
      ]);
      return { message: 'Password updated successfully' };
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ConflictException('New password must be different from the current password');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshToken: null, refreshTokenExpiresAt: null },
    });
    return { message: 'Password changed successfully' };
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    return tenantContext.runUnscoped(async () => {
      const user = await this.prisma.user.findUnique({
        where: { email: this.normalizeEmail(dto.email) },
        include: { tenant: { select: { isActive: true } } },
      });
      if (!user || !user.isActive || !user.tenant.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.sanitizeUser(user),
      };
    });
  }

  // ── REFRESH TOKEN ─────────────────────────────────────────────────────────
  async refreshToken(token?: string) {
    return tenantContext.runUnscoped(async () => {
      if (!token || typeof token !== 'string') {
        throw new UnauthorizedException('Refresh token missing');
      }

      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
          algorithms: ['HS256'],
        });
      } catch {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          tenantId: payload.tenantId,
          refreshToken: this.hashRefreshToken(token),
        },
        include: { tenant: { select: { isActive: true } } },
      });
      if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');
      if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }
      // Block deactivated accounts — even if they hold a valid token
      if (!user.isActive || !user.tenant.isActive) {
        throw new UnauthorizedException('Account has been deactivated');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    });
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenExpiresAt: null },
    });
    return { message: 'Logged out successfully' };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string, tenantId: string) {
    const payload = { sub: userId, email, role, tenantId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as any,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) {
      throw new UnauthorizedException('Refresh token has no expiration');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: this.hashRefreshToken(token),
        refreshTokenExpiresAt: new Date(decoded.exp * 1000),
      },
    });
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private sanitizeUser(user: any) {
    const {
      passwordHash: _passwordHash,
      refreshToken: _refreshToken,
      refreshTokenExpiresAt: _refreshTokenExpiresAt,
      ...safe
    } = user;
    return safe;
  }
}
