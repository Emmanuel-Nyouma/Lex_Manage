import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { N8nRagModule } from '../ai/n8n-rag.module';

@Module({
  imports: [N8nRagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
