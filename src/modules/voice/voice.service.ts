import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceService {
  constructor() {}

  async getPreset(id: string) {
    const phrases: Record<string, string> = {
      'praise_30_day': 'Thirty days strong. Outstanding discipline.',
      'alarm_wake': 'Up! Out of bed. Mission starts now.',
      'streak_save': 'Saved the streak. Keep the momentum.',
      'DGzg6RaUqxGRTHSBjfgF': 'Outstanding work, soldier! Keep pushing forward!',
    };

    const text = phrases[id];
    if (!text) {
      const defaultText = 'Outstanding work! Keep pushing forward!';
      try {
        const url = await this.generateTTS(defaultText, 'balanced');
        return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
      } catch (error) {
        return {
          url: null,
          message: defaultText,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
      }
    }

    try {
      const url = await this.generateTTS(text, 'balanced');
      return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
    } catch (error) {
      return {
        url: null,
        message: text,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    }
  }

  private async generateTTS(text: string, tone: 'strict' | 'balanced' | 'light') {
    const voiceId =
      tone === 'strict'
        ? process.env.ELEVENLABS_VOICE_STRICT
        : tone === 'light'
        ? process.env.ELEVENLABS_VOICE_LIGHT
        : process.env.ELEVENLABS_VOICE_BALANCED;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || !voiceId) return null;
    const fetch = (await import('node-fetch')).default as any;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return `data:audio/mpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  }
} 