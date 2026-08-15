import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { tenantContext } from '../../../common/context/tenant.context';

export interface JwtPayload {
  sub: string;        // userId
  email: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return tenantContext.run(payload.tenantId, async () => {
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, tenantId: payload.tenantId, isActive: true },
        include: { tenant: { select: { isActive: true } } },
      });
      if (!user || !user.tenant.isActive) {
        throw new UnauthorizedException('Session is no longer active');
      }
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
    });
  }
}
