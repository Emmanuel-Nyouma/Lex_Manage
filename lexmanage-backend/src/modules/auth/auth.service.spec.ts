import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

describe('AuthService security controls', () => {
  const prisma = {
    $transaction: jest.fn(),
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const jwt = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
    decode: jest.fn(),
  };
  const mail = { sendPasswordResetEmail: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    service = new AuthService(prisma as never, jwt as never, mail as never);
  });

  it('refuse un refresh sans cookie au lieu de chercher un utilisateur arbitraire', async () => {
    await expect(service.refreshToken(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('vérifie le JWT et compare uniquement son empreinte avec le bon utilisateur et tenant', async () => {
    const token = 'signed-refresh-token';
    const hash = createHash('sha256').update(token).digest('hex');
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', tenantId: 'tenant-1', sessionVersion: 3 });
    jwt.signAsync
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');
    jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'avocat@example.com',
      role: 'LAWYER',
      isActive: true,
      refreshToken: hash,
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
      sessionVersion: 3,
      tenant: { isActive: true },
    });
    prisma.user.update.mockResolvedValue({});

    await expect(service.refreshToken(token)).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', tenantId: 'tenant-1', refreshToken: hash, sessionVersion: 3 },
    }));
    expect(jwt.verifyAsync).toHaveBeenCalledWith(token, {
      secret: 'test-secret',
      algorithms: ['HS256'],
    });
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sessionVersion: 3 }),
      expect.objectContaining({ algorithm: 'HS256' }),
    );
  });

  it('révoque immédiatement tous les jetons lors du logout', async () => {
    prisma.user.update.mockResolvedValue({});
    await service.logout('user-1');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('consomme le reset token avec une mise à jour conditionnelle atomique', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, tenant: { isActive: true } },
    });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const update = jest.fn().mockResolvedValue({});
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({ passwordResetToken: { updateMany }, user: { update } }),
    );

    await expect(
      service.resetPassword({ token: 'x'.repeat(64), newPassword: 'Password2' }),
    ).resolves.toEqual({ message: 'Password updated successfully' });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'reset-1', usedAt: null, expiresAt: { gt: expect.any(Date) } },
      data: { usedAt: expect.any(Date) },
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sessionVersion: { increment: 1 } }),
      }),
    );
  });

  it('ne consomme pas une invitation destinée à une autre adresse email', async () => {
    const updateMany = jest.fn();
    prisma.$transaction.mockImplementation(async (callback) => callback({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      invitation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'invitation-1',
          email: 'invitee@example.com',
          tenantId: 'tenant-1',
          role: 'LAWYER',
          used: false,
          expiresAt: new Date(Date.now() + 60_000),
          tenant: { isActive: true },
        }),
        updateMany,
      },
    }));

    await expect(service.register({
      email: 'attacker@example.com',
      password: 'Password1!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+237600000000',
      invitationToken: 'token',
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
