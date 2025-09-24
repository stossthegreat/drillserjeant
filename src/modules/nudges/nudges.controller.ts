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
    const res = await this.nudgesService.generateNudge('demo-user-123');

    // Map optional voice for Flutter
    const voicePayload = res.voice ? {
      url: res.voice.audioUrl || null,
      voiceId: res.voice.voiceId || null,
      source: res.voice.source || null,
    } : null;

    return {
      nudge: res.nudge,
      mentor: res.mentor,
      type: res.type || 'encouragement',
      voice: voicePayload,
      timestamp: res.timestamp,
    };
  }

  @Post('chat')
  async sendChatMessage(@Body() body: any) {
    const { message, mentor = '', mode = '', includeVoice = true } = body;

    // Prefer explicit mentor; otherwise map mode -> mentor
    const modeToMentor: Record<string, string> = {
      'strict': 'drill-sergeant',
      'light': 'marcus-aurelius',
      'balanced': 'confucius',
    };
    const mentorKey = mentor || modeToMentor[mode] || 'drill-sergeant';
    
    // Generate mentor response (and optionally voice)
    const response = await this.nudgesService.generateChatResponse(message, mentorKey, includeVoice);

    // Map voice to Flutter-expected shape
    const voicePayload = includeVoice && response.voice ? {
      url: response.voice.audioUrl || null,
      voiceId: response.voice.voiceId || null,
      source: response.voice.source || null,
    } : null;
    
    return {
      reply: response.message,
      mentor: response.mentor,
      voice: voicePayload,
      audioPresetId: null,
      timestamp: new Date().toISOString()
    };
  }
} 