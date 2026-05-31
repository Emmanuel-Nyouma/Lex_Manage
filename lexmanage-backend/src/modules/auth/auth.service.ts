import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ... (register method)

  // ── REGISTER (Creates a new Tenant + Admin user OR Joins via Invitation) ─
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    let tenantId: string;
    let role: any = 'CABINET_ADMIN';

    if (dto.invitationToken) {
      const invitation = await this.prisma.invitation.findUnique({
        where: { token: dto.invitationToken },
      });

      if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired invitation token');
      }

      tenantId = invitation.tenantId;
      role = invitation.role;

      // Mark invitation as used
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { used: true },
      });
    } else {
      if (!dto.tenantName) throw new ConflictException('Tenant name is required for new cabinets');
      
      const slug = dto.tenantName.toLowerCase().replace(/\s+/g, '-') + '-' + uuidv4().slice(0, 6);

      const tenant = await this.prisma.tenant.create({
        data: { 
          name: dto.tenantName, 
          slug,
          country: dto.country,
          city: dto.city
        },
      });
      tenantId = tenant.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: role,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
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

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ── REFRESH TOKEN ─────────────────────────────────────────────────────────
  async refreshToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken: token },
    });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token, refreshTokenExpiresAt: expiresAt },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, refreshToken, refreshTokenExpiresAt, ...safe } = user;
    return safe;
  }
}
