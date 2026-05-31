import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents for the firm' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('caseId') caseId?: string,
  ) {
    if (caseId) return this.documentsService.findByCase(caseId, tenantId);
    return this.documentsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.documentsService.findOne(id, tenantId);
  }

  @Get(':id/url')
  getSignedUrl(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.documentsService.getSignedUrl(id, tenantId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string | undefined,
    @Body('category') category: string | undefined,
    @Body('caseId') bodyCaseId: string | undefined,
    @Query('caseId') queryCaseId: string | undefined,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.upload(file, tenantId, userId, {
      title,
      category,
      caseId: bodyCaseId || queryCaseId,
    });
  }

  @Post()
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(dto, tenantId, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.documentsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.documentsService.remove(id, tenantId);
  }
}
