import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceService {
  async generateTTS(text: string, voice: string = 'drill-sergeant') {
    // Mock TTS - in real implementation would call ElevenLabs API
    return {
      audioUrl: `https://mock-tts.com/audio/${encodeURIComponent(text)}`,
      voice,
      text,
      timestamp: new Date().toISOString()
    };
  }
} 