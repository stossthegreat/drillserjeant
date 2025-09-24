import { Controller, Post, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('v1/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('tts')
  async generateTTS(@Body() body: { text: string; voice?: string }) {
    return this.voiceService.generateTTS(body.text, body.voice);
  }
} 