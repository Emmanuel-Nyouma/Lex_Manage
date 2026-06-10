import { Module } from '@nestjs/common';
import { N8nRagService } from './n8n-rag.service';

/**
 * Standalone module exposing the n8n Legal RAG bridge.
 * Dependency-free so it can be imported anywhere without circular deps.
 */
@Module({
  providers: [N8nRagService],
  exports: [N8nRagService],
})
export class N8nRagModule {}
