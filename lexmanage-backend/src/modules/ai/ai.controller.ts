import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with LexAssist AI' })
  async chat(
    @Body() dto: { message: string; conversationId?: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    // For simplicity, we use a default conversation ID if none provided
    const conversationId = dto.conversationId || 'default-session';
    return this.aiService.chat(dto.message, conversationId, tenantId);
  }
}
