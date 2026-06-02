import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { UpdateCaseDto } from './dto/case.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateCaseSchema } from '../../common/schemas/case.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cases for the firm' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.casesService.findAll(tenantId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific case details' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.casesService.findOne(id, tenantId);
  }

  @Post()
  @Roles('CABINET_ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'Open a new case' })
  @UsePipes(new ZodValidationPipe(CreateCaseSchema))
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.casesService.create(dto, user.tenantId, user.id);
  }

  @Patch(':id')
  @Roles('CABINET_ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'Update case information' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.update(id, dto, tenantId, userId);
  }

  @Delete(':id')
  @Roles('CABINET_ADMIN')
  @ApiOperation({ summary: 'Delete a case (Admin only)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.remove(id, tenantId, userId);
  }
}
