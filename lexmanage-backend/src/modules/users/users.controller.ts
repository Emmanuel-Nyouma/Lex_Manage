import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateUserSchema, UpdateUserSchema } from '../../common/schemas/user.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  @Post()
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  create(
    @Body() dto: any,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.create(dto, tenantId, userId);
  }

  @Patch(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, dto, tenantId, userId);
  }

  @Delete(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  deactivate(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.deactivate(id, tenantId, userId);
  }
}
