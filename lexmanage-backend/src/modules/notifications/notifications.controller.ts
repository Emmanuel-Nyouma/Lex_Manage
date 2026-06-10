import { Controller, Get, Post, Delete, Param, Patch, UseGuards, Body, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService, CreateTemplateDto, CreateScheduledDto } from './notifications.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateNotificationSchema, CreateTemplateSchema, CreateScheduledSchema } from '../../common/schemas/notification.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.findAll(userId, tenantId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  getUnreadCount(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.getUnreadCount(userId, tenantId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateNotificationSchema))
  @ApiOperation({ summary: 'Create a firm-wide or targeted notification' })
  create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.create(dto, tenantId, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all of the current user notifications as read' })
  markAllAsRead(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.markAllAsRead(userId, tenantId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId, tenantId);
  }

  // ── History ────────────────────────────────────────────────────

  @Get('history')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all notifications sent by admins (not SYSTEM)' })
  getHistory(@CurrentUser('tenantId') tenantId: string) {
    return this.notificationsService.getHistory(tenantId);
  }

  @Delete('history/:id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a sent notification from the firm history' })
  deleteFromHistory(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteFromHistory(tenantId, id);
  }

  // ── Templates ──────────────────────────────────────────────────

  @Get('templates')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List notification templates for the firm' })
  getTemplates(@CurrentUser('tenantId') tenantId: string) {
    return this.notificationsService.getTemplates(tenantId);
  }

  @Post('templates')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateTemplateSchema))
  @ApiOperation({ summary: 'Create a notification template' })
  createTemplate(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.notificationsService.createTemplate(tenantId, userId, dto);
  }

  @Delete('templates/:id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a notification template' })
  deleteTemplate(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteTemplate(tenantId, id);
  }

  // ── Scheduled ──────────────────────────────────────────────────

  @Get('scheduled')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List scheduled notifications for the firm' })
  getScheduled(@CurrentUser('tenantId') tenantId: string) {
    return this.notificationsService.getScheduled(tenantId);
  }

  @Post('scheduled')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(CreateScheduledSchema))
  @ApiOperation({ summary: 'Schedule a notification for a future date' })
  createScheduled(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScheduledDto,
  ) {
    return this.notificationsService.createScheduled(tenantId, userId, dto);
  }

  @Delete('scheduled/:id')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cancel a pending scheduled notification' })
  cancelScheduled(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.cancelScheduled(tenantId, id);
  }

  @Delete('scheduled/:id/permanent')
  @Roles('CABINET_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Permanently delete a scheduled notification (any status)' })
  deleteScheduled(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteScheduled(tenantId, id);
  }
}
