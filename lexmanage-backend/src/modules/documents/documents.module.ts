import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MinioService } from './minio.service';
import { OcrService } from './ocr.service';
import { AuditModule } from '../audit/audit.module';
import { N8nRagModule } from '../ai/n8n-rag.module';
import { MalwareScannerService } from './malware-scanner.service';

@Module({
  imports: [AuditModule, N8nRagModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService, OcrService, MalwareScannerService],
  exports: [DocumentsService, MinioService],
})
export class DocumentsModule {}
