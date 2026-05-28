import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotFoundException } from '@nestjs/common';

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
    const targetCase = await this.prisma.case.findFirst({
      where: { id: caseId, tenantId },
      select: { id: true },
    });
    if (!targetCase) throw new NotFoundException('Case not found');

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
    const deadline = await this.prisma.deadline.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!deadline) throw new NotFoundException('Deadline not found');

    return this.prisma.deadline.update({
      where: { id },
      data: { isDone: true },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deadline' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const deadline = await this.prisma.deadline.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!deadline) throw new NotFoundException('Deadline not found');

    await this.prisma.deadline.delete({ where: { id } });
    return { message: 'Deadline deleted' };
  }
}
