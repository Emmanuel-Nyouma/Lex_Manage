import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class SendMessageDto {
  @IsString() @MinLength(1) message: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.tenantId, user.id);
  }

  @Post('conversations')
  createConversation(@CurrentUser() user: any) {
    return this.chatService.createConversation(user.tenantId, user.id);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.getConversation(id, user.tenantId, user.id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.chatService.sendMessage(id, dto.message, user.tenantId, user.id);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.deleteConversation(id, user.tenantId, user.id);
  }
}
