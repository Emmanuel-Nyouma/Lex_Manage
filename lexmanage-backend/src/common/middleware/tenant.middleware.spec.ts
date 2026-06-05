import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TenantMiddleware } from './tenant.middleware';
import { tenantContext } from '../context/tenant.context';
import { Request, Response } from 'express';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMiddleware,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should extract tenantId from valid token', async () => {
    const mockPayload = { tenantId: 'tenant-123', sub: 'user-1' };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

    const req = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as any as Request;
    const res = {} as Response;
    const next = jest.fn();

    const runSpy = jest.spyOn(tenantContext, 'run');

    await middleware.use(req, res, next);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', expect.any(Object));
    expect(runSpy).toHaveBeenCalledWith('tenant-123', expect.any(Function));
    expect(next).toHaveBeenCalled();
  });

  it('should handle missing authorization header', async () => {
    const req = {
      headers: {},
    } as any as Request;
    const res = {} as Response;
    const next = jest.fn();

    const runSpy = jest.spyOn(tenantContext, 'run');

    await middleware.use(req, res, next);

    expect(runSpy).toHaveBeenCalledWith(undefined, expect.any(Function));
    expect(next).toHaveBeenCalled();
  });

  it('should handle invalid token (verification failure)', async () => {
    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    } as any as Request;
    const res = {} as Response;
    const next = jest.fn();

    const runSpy = jest.spyOn(tenantContext, 'run');

    await middleware.use(req, res, next);

    expect(runSpy).toHaveBeenCalledWith(undefined, expect.any(Function));
    expect(next).toHaveBeenCalled();
  });
});
