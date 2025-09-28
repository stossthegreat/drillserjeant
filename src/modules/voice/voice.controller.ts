import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { MentorsService, MentorKey } from '../mentors/mentors.service';

@ApiTags('Voice')
@Controller('v1/voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService, private readonly mentors: MentorsService) {}

  @Post('tts')
  @ApiOperation({ summary: 'Generate TTS for text' })
  async tts(@Body() body: any) {
    const { text, voice = 'balanced' } = body || {};
    const url = await this.voice['generateTTS'](text, voice);
    return { url };
  }

  @Get('preset/:id')
  @ApiOperation({ summary: 'Get preset voice line' })
  async preset(@Param('id') id: string) {
    return this.voice.getPreset(id);
  }

  @Post('preload')
  @ApiOperation({ summary: 'Preload and cache voice lines for a mentor' })
  async preload(@Body() body: any) {
    const { mentor, lines } = body || {};
    const key = (mentor || 'drill_sergeant') as MentorKey;
    const results: string[] = [];
    for (const line of (lines || [])) {
      const url = await this.mentors.generateVoiceForMentor(line, key, 'balanced');
      if (url) results.push(url);
    }
    return { cached: results.length };
  }
} 