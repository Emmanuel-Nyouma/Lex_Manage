import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMyTenant(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getMyTenant(tenantId);
  }

  @Get('members')
  @Roles('CABINET_ADMIN')
  getMembers(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getMembers(tenantId);
  }

  @Post('invitations')
  @Roles('CABINET_ADMIN')
  createInvitation(
    @CurrentUser('tenantId') tenantId: string,
    @Body('email') email: string,
    @Body('role') role: string,
  ) {
    return this.tenantsService.createInvitation(tenantId, email, role);
  }

  @Get('invitations')
  @Roles('CABINET_ADMIN')
  getInvitations(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getInvitations(tenantId);
  }

  @Delete('invitations/:id')
  @Roles('CABINET_ADMIN')
  revokeInvitation(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tenantsService.revokeInvitation(tenantId, id);
  }
}
