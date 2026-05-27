import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('deadlines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cases/:caseId/deadlines')
export class DeadlinesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deadline for a case' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Param('caseId') caseId: string,
    @Body() dto: { title: string; dueAt: string; priority: string },
  ) {
    return this.prisma.deadline.create({
      data: {
        ...dto,
        dueAt: new Date(dto.dueAt),
        caseId,
        tenantId,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all deadlines for a case' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Param('caseId') caseId: string,
  ) {
    return this.prisma.deadline.findMany({
      where: { caseId, tenantId },
      orderBy: { dueAt: 'asc' },
    });
  }

  @Patch(':id/done')
  @ApiOperation({ summary: 'Mark a deadline as done' })
  async markAsDone(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.prisma.deadline.update({
      where: { id, tenantId },
      data: { isDone: true },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deadline' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    await this.prisma.deadline.delete({ where: { id, tenantId } });
    return { message: 'Deadline deleted' };
  }
}
