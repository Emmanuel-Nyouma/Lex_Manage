import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
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
  create(@Body() dto: CreateUserDto, @CurrentUser('tenantId') tenantId: string) {
    return this.usersService.create(dto, tenantId);
  }

  @Patch(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser('tenantId') tenantId: string) {
    return this.usersService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  deactivate(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.usersService.deactivate(id, tenantId);
  }
}
