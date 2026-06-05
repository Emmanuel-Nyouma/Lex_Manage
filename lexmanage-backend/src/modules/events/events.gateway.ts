import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

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

      // Verify user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true, tenantId: true },
      });

      if (!user || !user.isActive || user.tenantId !== tenantId) {
        this.logger.warn(`Unauthorized WebSocket connection attempt: User ${userId}`);
        client.disconnect();
        return;
      }

      // Join room based on tenant for isolation
      client.join(`tenant_${tenantId}`);
      // Join room based on user for private notifications
      client.join(`user_${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Tenant: ${tenantId})`);
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
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
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data };
  }
}
