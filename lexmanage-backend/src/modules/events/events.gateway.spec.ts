import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  const jwt = { verify: vi.fn() };
  const prisma: any = { user: { findFirst: vi.fn() } };
  const server = { to: vi.fn(), emit: vi.fn() };
  let gateway: EventsGateway;

  const makeClient = (token?: string) => ({
    id: 'socket-1',
    handshake: { auth: token ? { token } : {}, headers: {} },
    data: {},
    join: vi.fn(),
    disconnect: vi.fn(),
  }) as any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    server.to.mockReturnValue(server);
    gateway = new EventsGateway(jwt as any, prisma);
    gateway.server = server as any;
  });

  afterEach(() => vi.useRealTimers());

  it('rejette une connexion sans jeton ou avec charge invalide', async () => {
    const missing = makeClient();
    await gateway.handleConnection(missing);
    expect(missing.disconnect).toHaveBeenCalled();

    const invalid = makeClient('token');
    jwt.verify.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-a', sessionVersion: 1 });
    await gateway.handleConnection(invalid);
    expect(invalid.disconnect).toHaveBeenCalled();
  });

  it('rejette un utilisateur inactif ou un jeton invalide', async () => {
    const client = makeClient('token');
    jwt.verify.mockReturnValue({
      sub: 'user-1', tenantId: 'tenant-a', sessionVersion: 1,
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    prisma.user.findFirst.mockResolvedValue({
      isActive: false, tenantId: 'tenant-a', tenant: { isActive: true },
    });
    await gateway.handleConnection(client);
    expect(client.disconnect).toHaveBeenCalled();

    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
    await gateway.handleConnection(makeClient('bad-token'));
  });

  it('rejoint uniquement les salons tenant et utilisateur après validation', async () => {
    vi.useFakeTimers();
    const client = makeClient('token');
    const exp = Math.floor(Date.now() / 1000) + 120;
    jwt.verify.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-a', sessionVersion: 3, exp });
    prisma.user.findFirst.mockResolvedValue({
      isActive: true, tenantId: 'tenant-a', tenant: { isActive: true },
    });

    await gateway.handleConnection(client);

    expect(jwt.verify).toHaveBeenCalledWith('token', { secret: 'test-secret', algorithms: ['HS256'] });
    expect(client.join).toHaveBeenCalledWith('tenant_tenant-a');
    expect(client.join).toHaveBeenCalledWith('user_user-1');
    expect(client.data.auth).toEqual({
      tenantId: 'tenant-a', userId: 'user-1', sessionVersion: 3, expiresAt: exp * 1000,
    });
    gateway.handleDisconnect(client);
  });

  it('émet seulement vers des salons explicitement identifiés', () => {
    gateway.emitToTenant('', 'case.created', {});
    gateway.emitToUser('', 'notification.new', {});
    expect(server.to).not.toHaveBeenCalled();

    gateway.emitToTenant('tenant-a', 'case.created', { id: 'case-1' });
    gateway.sendToTenant('tenant-b', 'case.updated', { id: 'case-2' });
    gateway.emitToUser('user-1', 'notification.new', { id: 'notification-1' });
    expect(server.to).toHaveBeenCalledWith('tenant_tenant-a');
    expect(server.to).toHaveBeenCalledWith('tenant_tenant-b');
    expect(server.to).toHaveBeenCalledWith('user_user-1');
  });

  it('réauthentifie un ping et déconnecte une session expirée ou révoquée', async () => {
    const client = makeClient('token');
    client.data.auth = {
      tenantId: 'tenant-a', userId: 'user-1', sessionVersion: 2,
      expiresAt: Date.now() + 60_000,
    };
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenant: { isActive: true } });
    await expect(gateway.handlePing(client, { now: 1 })).resolves.toEqual({ event: 'pong', data: { now: 1 } });

    client.data.auth.expiresAt = Date.now() - 1;
    await expect(gateway.handlePing(client, {})).resolves.toBeUndefined();
    expect(client.disconnect).toHaveBeenCalledWith(true);

    client.data.auth.expiresAt = Date.now() + 60_000;
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(gateway.handlePing(client, {})).resolves.toBeUndefined();
  });
});
