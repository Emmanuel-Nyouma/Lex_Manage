import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CasesService } from '../modules/cases/cases.service';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(JwtAuthGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => CasesService))
    private casesService: CasesService,
  ) {}

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup
  }

  // Helper method to emit to a specific tenant
  sendToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }
}
