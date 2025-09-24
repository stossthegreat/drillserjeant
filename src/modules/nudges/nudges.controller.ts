import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NudgesService } from './nudges.service';

@ApiTags('Nudges')
@Controller('v1')
export class NudgesController {
  constructor(private readonly nudgesService: NudgesService) {}

  @Get('nudge')
  @ApiOperation({ summary: 'Get AI nudge based on user progress' })
  @ApiResponse({ status: 200, description: 'Nudge retrieved' })
  @ApiBearerAuth()
  async getNudge() {
    return this.nudgesService.generateNudge('demo-user-123');
  }

  @Post('chat')
  async sendChatMessage(@Body() body: any) {
    const { message, mentor = 'drill-sergeant' } = body;
    
    // Generate mentor response based on personality
    const response = await this.nudgesService.generateChatResponse(message, mentor);
    
    return {
      reply: response.message,
      mentor: response.mentor,
      voice: response.voice || null,
      timestamp: new Date().toISOString()
    };
  }
} 