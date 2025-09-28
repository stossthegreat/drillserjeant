import { Injectable } from '@nestjs/common';
import { MentorsService, MentorKey } from '../mentors/mentors.service';
let OpenAI: any = null;
try { OpenAI = require('openai').OpenAI; } catch {}

@Injectable()
export class NudgesService {
  constructor(private readonly mentors: MentorsService) {}

  async generateNudge(userId: string) {
    const { text, voice, voiceUrl, mentor } = await this.mentors.generateMentorLine(userId, 'primer');
    return { text, tone: voice, mentor, voice: { url: voiceUrl } };
  }

  private mentorFromMode(mode?: string, mentor?: string): MentorKey {
    const m = (mentor || mode || 'drill_sergeant').toString().toLowerCase();
    if (m.includes('marcus')) return 'marcus_aurelius';
    if (m.includes('confuc')) return 'confucius';
    if (m.includes('buddha')) return 'buddha';
    if (m.includes('lincoln') || m.includes('abraham')) return 'abraham_lincoln';
    return 'drill_sergeant';
  }

  async generateChatResponse({ userId, mode, mentor, message, includeVoice = true }:
    { userId: string; mode?: string; mentor?: string; message: string; includeVoice?: boolean }) {
    const mentorKey = this.mentorFromMode(mode, mentor);
    const apiKey = process.env.OPENAI_API_KEY;
    let reply = 'Copy that.';
    if (apiKey && OpenAI) {
      const client = new OpenAI({ apiKey });
      const sys = `You are ${mentorKey.replace('_', ' ')}. Speak concisely, 1-3 sentences, motivating.`;
      const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 140,
      });
      reply = res.choices?.[0]?.message?.content?.trim() || reply;
    }

    let voiceUrl: string | null = null;
    if (includeVoice) {
      voiceUrl = await this.mentors.generateVoiceForMentor(reply, mentorKey, 'balanced');
    }

    return {
      reply,
      mentor: mentorKey,
      voice: { url: voiceUrl },
    };
  }
} 