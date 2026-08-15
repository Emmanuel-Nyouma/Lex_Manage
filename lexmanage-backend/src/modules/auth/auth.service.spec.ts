import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { vi } from 'vitest';

const bcryptMocks = vi.hoisted(() => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('bcryptjs', () => bcryptMocks);

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
    delete process.env.FRONTEND_URL;
    delete process.env.ALLOWED_ORIGINS;
    bcryptMocks.hash.mockResolvedValue('hashed-password');
    bcryptMocks.compare.mockResolvedValue(false);
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

  it('crée un cabinet avec un slug normalisé et stocke seulement le hash du refresh token', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: 'user-1', sessionVersion: 0, ...data,
        })),
      },
      tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
      invitation: { findUnique: jest.fn(), updateMany: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    jwt.decode.mockReturnValue({ exp: 2_000_000_000 });
    prisma.user.update.mockResolvedValue({});

    const result: any = await service.register({
      email: ' Admin@Example.COM ', password: 'Password1!', firstName: ' Ada ', lastName: ' Lovelace ',
      tenantName: ' Cabinet Élite & Associés ', country: 'CM', city: 'Douala',
    } as any);

    expect(tx.tenant.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      name: 'Cabinet Élite & Associés',
      slug: expect.stringMatching(/^cabinet-elite-associes-[0-9a-f]{6}$/),
    }) });
    expect(tx.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      tenantId: 'tenant-1', email: 'admin@example.com', passwordHash: 'hashed-password',
      firstName: 'Ada', lastName: 'Lovelace', role: 'CABINET_ADMIN',
    }) });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        refreshToken: createHash('sha256').update('refresh-token').digest('hex'),
        refreshTokenExpiresAt: new Date(2_000_000_000 * 1000),
      },
    });
    expect(result.user.passwordHash).toBeUndefined();
    expect(result).toEqual(expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' }));
  });

  it('utilise un slug cabinet si le nom ne contient aucun caractère alphanumérique', async () => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({
        id: 'u1', email: 'a@example.com', role: 'CABINET_ADMIN', tenantId: 't1', sessionVersion: 0,
      }) },
      tenant: { create: jest.fn().mockResolvedValue({ id: 't1' }) },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    jwt.decode.mockReturnValue({ exp: 2_000_000_000 });

    await service.register({
      email: 'a@example.com', password: 'Password1!', firstName: 'A', lastName: 'B', tenantName: '---',
    } as any);
    expect(tx.tenant.create.mock.calls[0][0].data.slug).toMatch(/^cabinet-[0-9a-f]{6}$/);
  });

  it('rejette un email déjà inscrit ou un cabinet sans nom', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback) => callback({
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'existing' }) },
    }));
    await expect(service.register({ email: 'a@example.com', password: 'x' } as any))
      .rejects.toBeInstanceOf(ConflictException);

    prisma.$transaction.mockImplementationOnce(async (callback) => callback({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    }));
    await expect(service.register({ email: 'a@example.com', password: 'x', tenantName: ' ' } as any))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    ['missing', null],
    ['used', { used: true, expiresAt: new Date(Date.now() + 60_000), tenant: { isActive: true }, email: 'a@example.com' }],
    ['expired', { used: false, expiresAt: new Date(Date.now() - 60_000), tenant: { isActive: true }, email: 'a@example.com' }],
    ['inactive tenant', { used: false, expiresAt: new Date(Date.now() + 60_000), tenant: { isActive: false }, email: 'a@example.com' }],
  ])('rejette une invitation %s', async (_label, invitation) => {
    prisma.$transaction.mockImplementation(async (callback) => callback({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      invitation: { findUnique: jest.fn().mockResolvedValue(invitation), updateMany: jest.fn() },
    }));
    await expect(service.register({
      email: 'a@example.com', password: 'x', firstName: 'A', lastName: 'B', invitationToken: 'token',
    } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('consomme une invitation et rabaisse SUPER_ADMIN à CABINET_ADMIN', async () => {
    const invitation = {
      id: 'invite-1', tenantId: 'tenant-1', email: 'A@example.com', role: 'SUPER_ADMIN', used: false,
      expiresAt: new Date(Date.now() + 60_000), tenant: { isActive: true },
    };
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'u1', sessionVersion: 0, ...data })),
      },
      invitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    jwt.decode.mockReturnValue({ exp: 2_000_000_000 });

    await service.register({
      email: 'a@example.com', password: 'x', firstName: 'A', lastName: 'B', invitationToken: 'token',
    } as any);
    expect(tx.invitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'invite-1', used: false }), data: { used: true },
    }));
    expect(tx.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      tenantId: 'tenant-1', role: 'CABINET_ADMIN',
    }) });
  });

  it('rejette une invitation gagnée par une autre requête concurrente', async () => {
    prisma.$transaction.mockImplementation(async (callback) => callback({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      invitation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'i1', tenantId: 't1', email: 'a@example.com', role: 'LAWYER', used: false,
          expiresAt: new Date(Date.now() + 60_000), tenant: { isActive: true },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    }));
    await expect(service.register({
      email: 'a@example.com', password: 'x', firstName: 'A', lastName: 'B', invitationToken: 'token',
    } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('récupère et met à jour un profil sans exposer les secrets', async () => {
    const user = {
      id: 'u1', email: 'a@example.com', passwordHash: 'hash', refreshToken: 'token',
      refreshTokenExpiresAt: new Date(), firstName: 'Ada',
    };
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce({ ...user, firstName: 'Grace' });

    await expect(service.getMe('u1')).resolves.toEqual({ id: 'u1', email: 'a@example.com', firstName: 'Ada' });
    await expect(service.updateProfile('u1', { firstName: 'Grace', lastName: 'Hopper', phone: '123' }))
      .resolves.toEqual({ id: 'u1', email: 'a@example.com', firstName: 'Grace' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' }, data: { firstName: 'Grace', lastName: 'Hopper', phone: '123' },
    });
  });

  it('retourne 404 pour un profil absent', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getMe('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('crée et envoie un reset token sans révéler si le compte existe', async () => {
    process.env.FRONTEND_URL = 'https://lex.test/';
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', tenantId: 't1', email: 'a@example.com', isActive: true, tenant: { isActive: true },
    });
    prisma.passwordResetToken.upsert.mockResolvedValue({});
    mail.sendPasswordResetEmail.mockResolvedValue(undefined);

    await expect(service.requestPasswordReset(' A@Example.com ')).resolves.toEqual({
      message: 'If an active account exists, a reset link has been sent.',
    });
    expect(prisma.passwordResetToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1' },
      update: expect.objectContaining({ tenantId: 't1', usedAt: null, tokenHash: expect.any(String) }),
      create: expect.objectContaining({ tenantId: 't1', userId: 'u1', tokenHash: expect.any(String) }),
    }));
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
      'a@example.com', expect.stringMatching(/^https:\/\/lex\.test\/login\?mode=reset_password&token=[0-9a-f]{64}$/),
    );
  });

  it('utilise ALLOWED_ORIGINS comme repli et ne traite pas les comptes inactifs', async () => {
    process.env.ALLOWED_ORIGINS = 'https://first.test,https://second.test';
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1', tenantId: 't1', email: 'a@example.com', isActive: true, tenant: { isActive: true },
    });
    await service.requestPasswordReset('a@example.com');
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
      'a@example.com', expect.stringMatching(/^https:\/\/first\.test\/login/),
    );

    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', isActive: false, tenant: { isActive: true },
    });
    await service.requestPasswordReset('a@example.com');
    expect(prisma.passwordResetToken.upsert).not.toHaveBeenCalled();
  });

  it('stocke le reset token même si aucune URL frontend n’est configurée', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', tenantId: 't1', email: 'a@example.com', isActive: true, tenant: { isActive: true },
    });
    await service.requestPasswordReset('a@example.com');
    expect(prisma.passwordResetToken.upsert).toHaveBeenCalled();
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', null],
    ['used', { usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000), user: { isActive: true, tenant: { isActive: true } } }],
    ['expired', { usedAt: null, expiresAt: new Date(Date.now() - 1), user: { isActive: true, tenant: { isActive: true } } }],
    ['inactive user', { usedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { isActive: false, tenant: { isActive: true } } }],
    ['inactive tenant', { usedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { isActive: true, tenant: { isActive: false } } }],
  ])('rejette un reset token %s', async (_label, record) => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(record);
    await expect(service.resetPassword({ token: 'x', newPassword: 'new' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejette un reset token consommé concurremment', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'r1', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() + 60_000),
      user: { isActive: true, tenant: { isActive: true } },
    });
    prisma.$transaction.mockImplementation(async (callback) => callback({
      passwordResetToken: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    }));
    await expect(service.resetPassword({ token: 'x', newPassword: 'new' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('change le mot de passe et révoque toutes les sessions', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'old-hash' });
    bcryptMocks.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(service.changePassword('u1', { currentPassword: 'old', newPassword: 'new' }))
      .resolves.toEqual({ message: 'Password changed successfully' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' }, data: {
        passwordHash: 'hashed-password', refreshToken: null, refreshTokenExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  it('rejette un mot de passe courant incorrect ou un nouveau mot de passe identique', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.changePassword('u1', { currentPassword: 'old', newPassword: 'new' }))
      .rejects.toBeInstanceOf(UnauthorizedException);

    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', passwordHash: 'hash' });
    bcryptMocks.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    await expect(service.changePassword('u1', { currentPassword: 'same', newPassword: 'same' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('connecte un compte actif et normalise son email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', tenantId: 't1', email: 'a@example.com', passwordHash: 'hash', role: 'LAWYER',
      sessionVersion: 2, isActive: true, tenant: { isActive: true },
    });
    bcryptMocks.compare.mockResolvedValue(true);
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    jwt.decode.mockReturnValue({ exp: 2_000_000_000 });

    const result: any = await service.login({ email: ' A@Example.com ', password: 'correct' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'a@example.com' },
    }));
    expect(result.user.passwordHash).toBeUndefined();
    expect(result.accessToken).toBe('access');
  });

  it.each([
    ['missing', null],
    ['inactive user', { isActive: false, tenant: { isActive: true } }],
    ['inactive tenant', { isActive: true, tenant: { isActive: false } }],
  ])('rejette un login pour un compte %s', async (_label, user) => {
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.login({ email: 'a@example.com', password: 'x' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejette un mot de passe de login incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({ isActive: true, tenant: { isActive: true }, passwordHash: 'hash' });
    bcryptMocks.compare.mockResolvedValue(false);
    await expect(service.login({ email: 'a@example.com', password: 'wrong' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejette un refresh JWT invalide', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    await expect(service.refreshToken('invalid')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ['missing user', null],
    ['missing hash', { refreshToken: null }],
    ['expired', { refreshToken: 'hash', refreshTokenExpiresAt: new Date(Date.now() - 1), isActive: true, tenant: { isActive: true } }],
    ['inactive user', { refreshToken: 'hash', isActive: false, tenant: { isActive: true } }],
    ['inactive tenant', { refreshToken: 'hash', isActive: true, tenant: { isActive: false } }],
  ])('rejette un refresh pour %s', async (_label, user) => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', tenantId: 't1', sessionVersion: 1 });
    prisma.user.findFirst.mockResolvedValue(user);
    await expect(service.refreshToken('refresh')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejette un refresh signé sans date d’expiration lors de la rotation', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', tenantId: 't1', sessionVersion: 1 });
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1', tenantId: 't1', email: 'a@example.com', role: 'LAWYER', sessionVersion: 1,
      refreshToken: 'hash', isActive: true, tenant: { isActive: true },
    });
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh-without-exp');
    jwt.decode.mockReturnValue(null);
    await expect(service.refreshToken('refresh')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
