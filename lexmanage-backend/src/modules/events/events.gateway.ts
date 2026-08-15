import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { tenantContext } from '../../common/context/tenant.context';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || ['http://localhost:3000'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
      });
      
      const tenantId = payload.tenantId;
      const userId = payload.sub;
      if (!tenantId || !userId || !Number.isInteger(payload.sessionVersion) || !payload.exp) {
        client.disconnect();
        return;
      }

      // Verify user exists and is active
      const user = await tenantContext.run(tenantId, () =>
        this.prisma.user.findFirst({
          where: { id: userId, tenantId, sessionVersion: payload.sessionVersion },
          select: {
            isActive: true,
            tenantId: true,
            tenant: { select: { isActive: true } },
          },
        }),
      );

      if (!user || !user.isActive || !user.tenant.isActive || user.tenantId !== tenantId) {
        this.logger.warn(`Unauthorized WebSocket connection attempt: User ${userId}`);
        client.disconnect();
        return;
      }

      // Join room based on tenant for isolation
      client.join(`tenant_${tenantId}`);
      // Join room based on user for private notifications
      client.join(`user_${userId}`);

      client.data.auth = {
        tenantId,
        userId,
        sessionVersion: payload.sessionVersion,
        expiresAt: payload.exp * 1000,
      };
      const remainingMs = Math.max(0, payload.exp * 1000 - Date.now());
      client.data.expiryTimer = setTimeout(() => client.disconnect(true), remainingMs);
      client.data.expiryTimer.unref?.();
      client.data.reauthTimer = setInterval(() => {
        void this.reauthenticate(client);
      }, 60_000);
      client.data.reauthTimer.unref?.();

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`);
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    clearTimeout(client.data.expiryTimer);
    clearInterval(client.data.reauthTimer);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- BROADCAST METHODS (Tenant Isolated) ---
  // SECURITY NOTE: All broadcasts MUST specify a tenantId to ensure firm-level isolation.
  // We use room-based isolation (tenant_${tenantId}) to prevent data leakage.

  /**
   * Broadcasts an event to all connected users within a specific firm.
   */
  emitToTenant(tenantId: string, event: string, data: any) {
    if (!tenantId) {
      this.logger.error(`Attempted broadcast to event ${event} without tenantId!`);
      return;
    }
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }

  /**
   * Alias for emitToTenant to maintain compatibility.
   */
  sendToTenant(tenantId: string, event: string, data: any) {
    this.emitToTenant(tenantId, event, data);
  }

  /**
   * Broadcasts a private event to a specific user across all their connected devices.
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!userId) {
      this.logger.error(`Attempted broadcast to event ${event} without userId!`);
      return;
    }
    this.server.to(`user_${userId}`).emit(event, data);
  }

  @SubscribeMessage('ping')
  async handlePing(client: Socket, data: any) {
    if (!(await this.reauthenticate(client))) return;
    return { event: 'pong', data };
  }

  private async reauthenticate(client: Socket): Promise<boolean> {
    const auth = client.data.auth as
      | { tenantId: string; userId: string; sessionVersion: number; expiresAt: number }
      | undefined;
    if (!auth || auth.expiresAt <= Date.now()) {
      client.disconnect(true);
      return false;
    }
    const user = await tenantContext.run(auth.tenantId, () =>
      this.prisma.user.findFirst({
        where: {
          id: auth.userId,
          tenantId: auth.tenantId,
          isActive: true,
          sessionVersion: auth.sessionVersion,
        },
        select: { id: true, tenant: { select: { isActive: true } } },
      }),
    );
    if (!user || !user.tenant.isActive) {
      client.disconnect(true);
      return false;
    }
    return true;
  }
}
