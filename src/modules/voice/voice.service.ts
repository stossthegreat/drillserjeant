import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceService {
  private readonly elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  
  // ElevenLabs voice IDs for different mentors
  private readonly mentorVoices = {
    'drill-sergeant': process.env.ELEVENLABS_VOICE_DRILL || 'pNInz6obpgDQGcFmaJgB',
    'marcus-aurelius': process.env.ELEVENLABS_VOICE_MARCUS || 'EXAVITQu4vr4xnSDxMaL', 
    'buddha': process.env.ELEVENLABS_VOICE_BUDDHA || 'ErXwobaYiN019PkySvjV',
    'abraham-lincoln': process.env.ELEVENLABS_VOICE_LINCOLN || '21m00Tcm4TlvDq8ikWAM',
    'confucius': process.env.ELEVENLABS_VOICE_CONFUCIUS || 'AZnzlk1XvdvUeBnXmlld'
  };

  async generateTTS(text: string, mentor: string = 'drill-sergeant') {
    const voiceId = this.mentorVoices[mentor] || this.mentorVoices['drill-sergeant'];
    
    // If no API key, return mock
    if (!this.elevenLabsApiKey) {
      console.log('⚠️ ElevenLabs API key not configured, using mock TTS');
      return {
        audioUrl: `https://mock-tts.com/audio/${encodeURIComponent(text)}`,
        voice: mentor,
        voiceId,
        text,
        source: 'mock',
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log(`🎵 Generating ElevenLabs TTS for ${mentor}: "${text.substring(0, 50)}..."`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      // In production, you'd save this to cloud storage and return the URL
      // For now, return a data URL or save locally
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      console.log(`✅ ElevenLabs TTS generated successfully for ${mentor}`);
      
      return {
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        voice: mentor,
        voiceId,
        text,
        source: 'elevenlabs',
        charCount: text.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ ElevenLabs TTS error for ${mentor}: ${error.message}`);
      
      // Fallback to mock on error
      return {
        audioUrl: `https://mock-tts.com/audio/${encodeURIComponent(text)}`,
        voice: mentor,
        voiceId,
        text,
        source: 'fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get available mentor voices
  getMentorVoices() {
    return Object.keys(this.mentorVoices);
  }

  // Test voice generation
  async testVoice(mentor: string = 'drill-sergeant') {
    const testMessage = `Hello! This is ${mentor.replace('-', ' ')} speaking. Your voice system is working perfectly!`;
    return this.generateTTS(testMessage, mentor);
  }
} 