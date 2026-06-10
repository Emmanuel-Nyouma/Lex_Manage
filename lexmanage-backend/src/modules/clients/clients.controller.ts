import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateClientSchema, UpdateClientSchema } from '../../common/schemas/client.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.clientsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.clientsService.findOne(id, tenantId);
  }

  @Post()
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateClientSchema))
  create(
    @Body() dto: any,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientsService.create(dto, tenantId, userId);
  }

  @Patch(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(UpdateClientSchema))
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientsService.update(id, dto, tenantId, userId);
  }

  @Delete(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientsService.remove(id, tenantId, userId);
  }
}
