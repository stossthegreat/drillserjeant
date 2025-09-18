import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Chat')
@Controller('v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send message to Drill Sergeant AI' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI response with structured actions',
    schema: {
      type: 'object',
      properties: {
        reply: { type: 'string' },
        updates: { type: 'array', items: { type: 'object' } },
        suggested_actions: { type: 'array', items: { type: 'object' } },
        confidence: { type: 'number' },
      }
    }
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async chat(@Req() req: any, @Body() body: { message: string; mode?: string; history?: any[] }) {
    const userId = req.user?.id;
    return this.chatService.processMessage(userId, body);
  }
} 