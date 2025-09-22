import { Injectable, ForbiddenException, HttpException } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class VoiceService {
  constructor(private readonly billing: BillingService) {}

  async getPreset(id: string) {
    // Handle both preset names and actual ElevenLabs voice IDs
    const phrases: Record<string, string> = {
      'praise_30_day': 'Thirty days strong. Outstanding discipline.',
      'alarm_wake': 'Up! Out of bed. Mission starts now.',
      'streak_save': 'Saved the streak. Keep the momentum.',
      'DGzg6RaUqxGRTHSBjfgF': 'Outstanding work, soldier! Keep pushing forward!', // Default drill sergeant response
    };
    
    const text = phrases[id];
    if (!text) {
      // If not found in phrases, create a generic response for voice IDs
      console.log(`Voice preset not found for ID: ${id}, using default response`);
      const defaultText = 'Outstanding work! Keep pushing forward!';
      try {
        const url = await this.generateTTS(defaultText, 'balanced');
        return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
      } catch (error) {
        console.error('TTS generation failed:', error);
        // Return a simple success response without audio if TTS fails
        return { 
          url: null, 
          message: defaultText,
          expiresAt: new Date(Date.now() + 3600000).toISOString() 
        };
      }
    }
    
    try {
      const url = await this.generateTTS(text, 'balanced');
      return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
    } catch (error) {
      console.error('TTS generation failed:', error);
      // Return text response without audio if TTS fails
      return { 
        url: null, 
        message: text,
        expiresAt: new Date(Date.now() + 3600000).toISOString() 
      };
    }
  }

// ... existing code ... 