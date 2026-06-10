import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { N8nRagModule } from './n8n-rag.module';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [N8nRagModule, DocumentsModule, PrismaModule],
  controllers: [AiController],
})
export class AiModule {}
