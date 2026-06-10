import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentType } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents for the firm with pagination' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('caseId') caseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    if (caseId) return this.documentsService.findByCase(caseId, tenantId);
    return this.documentsService.findAll(
      tenantId, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10,
      category
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.documentsService.findOne(id, tenantId);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Generate a presigned URL for downloading a document' })
  getDownloadUrl(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.documentsService.getSignedUrl(id, tenantId);
  }

  @Post('upload')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new document' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string | undefined,
    @Body('documentType') documentType: DocumentType | undefined,
    @Body('category') category: string | undefined,
    @Body('subCategory') subCategory: string | undefined,
    @Body('allowedRoles') allowedRoles: string | undefined,
    @Body('caseId') bodyCaseId: string | undefined,
    @Body('courtCaseRef') courtCaseRef: string | undefined,
    @Query('caseId') queryCaseId: string | undefined,
    @Query('pending') pending: string | undefined,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.upload(file, tenantId, userId, {
      name,
      documentType,
      category,
      subCategory,
      allowedRoles: allowedRoles ? JSON.parse(allowedRoles) : undefined,
      courtCaseRef,
      caseId: bodyCaseId || queryCaseId,
      pending: pending === 'true',
    });
  }

  @Post()
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(dto, tenantId, userId);
  }

  @Patch(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.update(id, dto, tenantId, userId);
  }

  @Patch(':id/link-to-case')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'Link an existing document to a case' })
  linkToCase(
    @Param('id') id: string,
    @Body('caseId') caseId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.linkDocumentToCase(id, caseId, tenantId, userId);
  }

  @Delete(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.remove(id, tenantId, userId);
  }
}
