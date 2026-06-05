import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, Patch, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { TenantsService, UpdateTenantDto } from './tenants.service';
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
  @ApiOperation({ summary: 'Get current tenant info' })
  getMyTenant(@CurrentUser('tenantId') tenantId: string) {
    return this.tenantsService.getMyTenant(tenantId);
  }

  @Patch('me')
  @Roles('CABINET_ADMIN')
  @ApiOperation({ summary: 'Update firm info (name, address, contacts, identifiers)' })
  updateTenant(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(tenantId, dto);
  }

  @Post('me/logo')
  @Roles('CABINET_ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload / replace the firm logo' })
  uploadLogo(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tenantsService.uploadLogo(tenantId, file);
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

  @Patch('members/:id')
  @Roles('CABINET_ADMIN')
  updateMember(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body('role') role: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.tenantsService.updateMember(tenantId, id, { role, isActive });
  }

  @Delete('members/:id')
  @Roles('CABINET_ADMIN')
  @ApiOperation({ summary: 'Soft-disable a member (sets isActive=false, invalidates session). Hard deletion is not exposed via API.' })
  deactivateMember(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') requesterId: string,
    @Param('id') id: string,
  ) {
    if (id === requesterId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    return this.tenantsService.deactivateMember(tenantId, id);
  }
}
