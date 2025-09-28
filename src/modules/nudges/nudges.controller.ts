import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NudgesService } from './nudges.service';

@ApiTags('Nudges')
@Controller('v1')
export class NudgesController {
  constructor(private readonly nudges: NudgesService) {}

  @Get('nudge')
  @ApiOperation({ summary: 'Get a nudge line (text + optional voice)' })
  async getNudge(@Query('userId') userId = 'demo-user-123') {
    return this.nudges.generateNudge(userId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send message to mentor (text + optional voice)' })
  async chat(@Body() body: any) {
    const { mode, mentor, message, includeVoice = true, userId = 'demo-user-123' } = body || {};
    return this.nudges.generateChatResponse({ userId, mode, mentor, message, includeVoice });
  }
} 