import { BadRequestException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tenantContext } from './context/tenant.context';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { RolesGuard } from './guards/roles.guard';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { JwtStrategy } from '../modules/auth/strategies/jwt.strategy';

describe('infrastructure commune', () => {
  describe('tenantContext', () => {
    it('isole un tenant et restaure le contexte extérieur', async () => {
      expect(tenantContext.getTenantId()).toBeUndefined();
      await tenantContext.run('tenant-a', async () => {
        await Promise.resolve();
        expect(tenantContext.getTenantId()).toBe('tenant-a');
        expect(tenantContext.isUnscoped()).toBe(false);
      });
      expect(tenantContext.getTenantId()).toBeUndefined();
    });

    it('autorise explicitement une opération non scopée', () => {
      tenantContext.runUnscoped(() => {
        expect(tenantContext.isUnscoped()).toBe(true);
        expect(tenantContext.getTenantId()).toBeUndefined();
      });
    });
  });

  describe('RolesGuard', () => {
    const reflector = { getAllAndOverride: vi.fn() };
    const context = (user?: { role: string }) => ({
      getHandler: vi.fn(), getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as any;

    beforeEach(() => vi.clearAllMocks());

    it('autorise une route sans rôle requis', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      expect(new RolesGuard(reflector as any).canActivate(context())).toBe(true);
    });

    it('rejette un utilisateur absent ou doté du mauvais rôle', () => {
      reflector.getAllAndOverride.mockReturnValue(['CABINET_ADMIN']);
      const guard = new RolesGuard(reflector as any);
      expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context({ role: 'LAWYER' }))).toThrow('Required role: CABINET_ADMIN');
      expect(guard.canActivate(context({ role: 'CABINET_ADMIN' }))).toBe(true);
    });
  });

  describe('ZodValidationPipe', () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(2) }));

    it('ignore les paramètres qui ne sont pas le corps', () => {
      expect(pipe.transform('id-1', { type: 'param' } as any)).toBe('id-1');
    });

    it('retourne un corps validé et rejette un corps invalide', () => {
      expect(pipe.transform({ name: 'Lex' }, { type: 'body' } as any)).toEqual({ name: 'Lex' });
      expect(() => pipe.transform({ name: '' }, { type: 'body' } as any)).toThrow(BadRequestException);
    });
  });

  describe('JwtStrategy', () => {
    const prisma: any = { user: { findFirst: vi.fn() } };

    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
      vi.clearAllMocks();
    });

    it('rejette les charges incomplètes', async () => {
      const strategy = new JwtStrategy(prisma);
      await expect(strategy.validate({ sub: '', tenantId: 'tenant-a', sessionVersion: 0 } as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('valide uniquement une session et un tenant actifs', async () => {
      const strategy = new JwtStrategy(prisma);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1', email: 'user@example.com', role: 'LAWYER', tenantId: 'tenant-a',
        tenant: { isActive: true },
      });
      await expect(strategy.validate({
        sub: 'user-1', email: 'user@example.com', role: 'LAWYER',
        tenantId: 'tenant-a', sessionVersion: 4,
      })).resolves.toEqual({
        id: 'user-1', email: 'user@example.com', role: 'LAWYER', tenantId: 'tenant-a',
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          id: 'user-1', tenantId: 'tenant-a', isActive: true, sessionVersion: 4,
        }),
      }));

      prisma.user.findFirst.mockResolvedValue(null);
      await expect(strategy.validate({
        sub: 'user-1', email: 'user@example.com', role: 'LAWYER',
        tenantId: 'tenant-a', sessionVersion: 4,
      })).rejects.toThrow('Session is no longer active');
    });
  });

  describe('ApiExceptionFilter', () => {
    const response = {
      setHeader: vi.fn(), status: vi.fn(), json: vi.fn(),
    };
    const request = {
      get: vi.fn(() => 'request-1'), method: 'POST', originalUrl: '/api/resource',
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
      response.status.mockReturnValue(response);
    });

    it('normalise une erreur HTTP avec plusieurs messages', () => {
      const filter = new ApiExceptionFilter();
      filter.catch(new HttpException({ message: ['email invalid', 'name required'] }, 400), host);
      expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'request-1');
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400, code: 'VALIDATION_ERROR',
        message: 'email invalid name required', requestId: 'request-1', path: '/api/resource',
      }));
    });

    it('masque une erreur interne inattendue', () => {
      new ApiExceptionFilter().catch(new Error('database password leaked'), host);
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.',
      }));
    });

    it('traduit les conflits Prisma sans exposer leur message interne', () => {
      const error = new Prisma.PrismaClientKnownRequestError('unique failed', {
        code: 'P2002', clientVersion: '5.0.0', meta: { target: ['email'] },
      });
      new ApiExceptionFilter().catch(error, host);
      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'DUPLICATE_RESOURCE', fields: ['email'],
      }));
    });
  });
});
