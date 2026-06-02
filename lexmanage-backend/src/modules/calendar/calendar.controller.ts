import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  @Get('deadlines')
  @ApiOperation({ summary: 'Get all deadlines for the current tenant' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.prisma.deadline.findMany({
      where: { tenantId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            clientName: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });
  }
}
