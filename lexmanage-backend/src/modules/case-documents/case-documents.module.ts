import { Module } from '@nestjs/common';
import { CaseDocumentsService } from './case-documents.service';
import { CaseDocumentsController } from './case-documents.controller';

@Module({
  providers: [CaseDocumentsService],
  controllers: [CaseDocumentsController],
  exports: [CaseDocumentsService],
})
export class CaseDocumentsModule {}
