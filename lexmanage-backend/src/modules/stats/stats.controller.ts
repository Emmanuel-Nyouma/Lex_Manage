import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated stats for the dashboard' })
  getDashboardStats(@CurrentUser('firmId') firmId: string) {
    return this.statsService.getDashboardStats(firmId);
  }

  @Get('ai-dashboard')
  @ApiOperation({ summary: 'Get aggregated AI stats for the dashboard' })
  getAiDashboardData(@CurrentUser('firmId') firmId: string) {
    return this.statsService.getAiDashboardData(firmId);
  }
}
