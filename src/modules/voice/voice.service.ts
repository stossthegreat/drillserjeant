import { Injectable, ForbiddenException } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class VoiceService {
  constructor(private readonly billing: BillingService) {}

  async getPreset(id: string) {
    const presets = {
      'praise_30_day': 'https://example.com/audio/praise_30_day.mp3',
      'alarm_wake': 'https://example.com/audio/alarm_wake.mp3',
      'streak_save': 'https://example.com/audio/streak_save.mp3',
    } as const;

    const url = (presets as any)[id];
    if (!url) {
      throw new Error('Preset not found');
    }

    return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  }

  async synthesize(userId: string, text: string, voice?: string) {
    const plan = this.billing.getUserPlan(userId);
    if (plan !== 'PRO') {
      throw new ForbiddenException('Dynamic TTS requires PRO plan. Upgrade to continue.');
    }

    const allowed = await this.billing.checkQuota(userId, 'tts', text.length);
    if (!allowed) {
      throw new ForbiddenException('Daily TTS quota exceeded. Try again tomorrow.');
    }

    const cacheKey = this.generateCacheKey(text, voice);
    const cached = await this.checkCache(cacheKey);
    if (cached) {
      return {
        url: cached.url,
        cached: true,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    }

    const audioUrl = await this.generateTTS(text, voice);

    await this.cacheResult(cacheKey, audioUrl, text, voice);
    await this.billing.incrementUsage(userId, 'tts', text.length);

    return {
      url: audioUrl,
      cached: false,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usage: {
        charsUsed: text.length,
        charsRemaining: (await this.billing.getUsage(userId)).remaining.ttsChars
      }
    };
  }

  private generateCacheKey(text: string, voice?: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(text + (voice || 'balanced')).digest('hex');
  }

  private async checkCache(cacheKey: string) {
    return null;
  }

  private async generateTTS(text: string, voice?: string): Promise<string> {
    const voiceId = this.getVoiceId(voice);
    console.log(`🎙️  [MOCK] ElevenLabs TTS: voice=${voiceId}, chars=${text.length}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `https://example.com/audio/tts_${Date.now()}.mp3`;
  }

  private async cacheResult(cacheKey: string, url: string, text: string, voice?: string) {
    console.log(`💾 Caching TTS result: ${cacheKey.substring(0, 8)}...`);
  }

  private getVoiceId(voice?: string): string {
    const voiceMap = {
      strict: process.env.ELEVENLABS_VOICE_STRICT || 'voice_strict',
      balanced: process.env.ELEVENLABS_VOICE_BALANCED || 'voice_balanced',
      light: process.env.ELEVENLABS_VOICE_LIGHT || 'voice_light'
    } as const;
    return (voiceMap as any)[voice || 'balanced'];
  }
} 