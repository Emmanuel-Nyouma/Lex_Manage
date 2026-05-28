import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MinioService } from './minio.service';
import { OcrService } from './ocr.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService, OcrService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
