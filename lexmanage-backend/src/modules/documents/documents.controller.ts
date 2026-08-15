import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentType } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

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
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query('caseId') caseId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('q') query?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 10;
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 10;
    if (caseId) return this.documentsService.findByCase(caseId, tenantId, userId, role);
    return this.documentsService.findAll(
      tenantId,
      userId,
      role,
      cursor,
      safeLimit,
      category,
      query,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.documentsService.findOne(id, tenantId, userId, role);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Generate a presigned URL for downloading a document' })
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.documentsService.getSignedUrl(id, tenantId, userId, role);
  }

  @Post('upload')
  @Throttle({ short: { limit: 5, ttl: 60000 }, long: { limit: 100, ttl: 3600000 } })
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN', 'LAWYER')
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: 50 * 1024 * 1024 } }))
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
    let parsedAllowedRoles: Role[] | undefined;
    if (allowedRoles) {
      try {
        const parsed = JSON.parse(allowedRoles);
        const allowed = Object.values(Role);
        if (!Array.isArray(parsed) || parsed.some((item) => !allowed.includes(item))) {
          throw new Error('invalid roles');
        }
        parsedAllowedRoles = Array.from(new Set(parsed));
      } catch {
        throw new BadRequestException('allowedRoles must be a JSON array of valid roles');
      }
    }
    return this.documentsService.upload(file, tenantId, userId, {
      name,
      documentType,
      category,
      subCategory,
      allowedRoles: parsedAllowedRoles,
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
    @CurrentUser('role') role: Role,
  ) {
    return this.documentsService.update(id, dto, tenantId, userId, role);
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
    @CurrentUser('role') role: Role,
  ) {
    return this.documentsService.remove(id, tenantId, userId, role);
  }
}
