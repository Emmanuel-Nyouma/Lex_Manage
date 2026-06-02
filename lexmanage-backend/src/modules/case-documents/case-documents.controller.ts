import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CaseDocumentsService } from './case-documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('case-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('case-documents')
export class CaseDocumentsController {
  constructor(private readonly caseDocumentsService: CaseDocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Link a document to a case' })
  link(
    @Body('caseId') caseId: string,
    @Body('documentId') documentId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.caseDocumentsService.link(caseId, documentId, tenantId);
  }

  @Delete(':caseId/:documentId')
  @ApiOperation({ summary: 'Unlink a document from a case' })
  unlink(
    @Param('caseId') caseId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.caseDocumentsService.unlink(caseId, documentId, tenantId);
  }
}
