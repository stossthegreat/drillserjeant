import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
let OpenAI: any = null;
try { OpenAI = require('openai').OpenAI; } catch {}

export type MentorKey = 'drill_sergeant' | 'marcus_aurelius' | 'confucius' | 'buddha' | 'abraham_lincoln';

type Tone = 'strict' | 'balanced' | 'light';

@Injectable()
export class MentorsService {
  constructor(private readonly prisma: PrismaService) {}

  private pickMentor(kind: string): { key: MentorKey; tone: Tone } {
    if (kind === 'primer') return { key: 'drill_sergeant', tone: 'balanced' };
    if (kind === 'evening_reflection') return { key: 'marcus_aurelius', tone: 'light' };
    const keys: MentorKey[] = ['drill_sergeant', 'marcus_aurelius', 'confucius', 'buddha', 'abraham_lincoln'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const tones: Tone[] = ['strict', 'balanced', 'light'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    return { key, tone };
  }

  async generateMentorLine(userId: string, kind: string): Promise<{ text: string; voice: Tone; voiceUrl: string | null; mentor: MentorKey }> {
    const { key, tone } = this.pickMentor(kind);
    const text = await this.generateText(userId, key, tone, kind);
    const voiceUrl = await this.generateVoice(text, key, tone);
    return { text, voice: tone, voiceUrl, mentor: key };
  }

  private async generateText(userId: string, mentor: MentorKey, tone: Tone, kind: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && OpenAI) {
      const client = new OpenAI({ apiKey });
      const sys = this.buildSystemPrompt(mentor, tone, kind);
      const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `User: ${userId}. Generate a single, powerful line.` },
        ],
        temperature: 0.7,
        max_tokens: 120,
      });
      const text = res.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    }
    return this.fallbackLine(mentor, tone, kind);
  }

  private buildSystemPrompt(mentor: MentorKey, tone: Tone, kind: string): string {
    const persona = {
      drill_sergeant: 'Direct, commanding, punchy. 1-2 sentences max.',
      marcus_aurelius: 'Stoic, reflective, concise aphorism.',
      confucius: 'Wise, ordered, principle-based guidance.',
      buddha: 'Calm, mindful, compassionate focus cue.',
      abraham_lincoln: 'Measured, moral resolve, unifying.'
    }[mentor];
    const style = tone === 'strict' ? 'urgent' : tone === 'light' ? 'gentle' : 'motivational';
    return [
      `You are ${mentor.replace('_', ' ')}.`,
      `Style: ${persona} Tone: ${style}.`,
      `Context: ${kind}.` ,
      `Output: One short, memorable line (max 30 words). No preface.`
    ].join('\n');
  }

  private fallbackLine(mentor: MentorKey, tone: Tone, kind: string): string {
    const map: Record<string, string[]> = {
      primer: [
        'Up and move. First rep, then momentum.',
        'Begin now. Small spark, big fire.'
      ],
      midday_scan: [
        'Check alignment. One decisive action now.',
        'Course-correct: eliminate one distraction.'
      ],
      evening_reflection: [
        'Close the day with honesty. What one thing made you better?',
        'Be grateful, be precise, sleep ready.'
      ],
      random_interrupt: [
        'Surprise check: name your next action and do it.',
        'Prove it right now. One clean rep.'
      ],
    };
    const arr = map[kind] || ['Stay on target.'];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private async generateVoice(text: string, mentor: MentorKey, tone: Tone): Promise<string | null> {
    const voiceId = this.mapMentorToVoice(mentor) || this.mapToneToVoice(tone);
    const key = this.hash(text + '|' + voiceId);
    const existing = await this.prisma.voiceCache.findUnique({ where: { id: key } });
    if (existing) return existing.url;
    const url = await this.synthesizeWithVoiceId(text, voiceId);
    if (url) {
      await this.prisma.voiceCache.create({ data: { id: key, text, voice: voiceId, url } as any });
    }
    return url;
  }

  private mapMentorToVoice(mentor: MentorKey): string | undefined {
    const env = process.env;
    const candidates: string[] = [];
    switch (mentor) {
      case 'drill_sergeant':
        candidates.push(env.ELEVENLABS_VOICE_DRILL as string);
        candidates.push(env.ELEVENLABS_VOICE_DRILL_SERGEANT as string);
        candidates.push(env.ELEVENLABS_VOICE_DRILLSERGEANT as string);
        candidates.push(env.ELEVENLABS_DRILL_SERGEANT_VOICE as string);
        break;
      case 'marcus_aurelius':
        candidates.push(env.ELEVENLABS_VOICE_MARCUS_AURELIUS as string);
        candidates.push(env.ELEVENLABS_VOICE_MARCUS as string);
        candidates.push(env.ELEVENLABS_MARCUS_AURELIUS_VOICE as string);
        break;
      case 'confucius':
        candidates.push(env.ELEVENLABS_VOICE_CONFUCIUS as string);
        candidates.push(env.ELEVENLABS_CONFUCIUS_VOICE as string);
        break;
      case 'buddha':
        candidates.push(env.ELEVENLABS_VOICE_BUDDHA as string);
        candidates.push(env.ELEVENLABS_BUDDHA_VOICE as string);
        break;
      case 'abraham_lincoln':
        candidates.push(env.ELEVENLABS_VOICE_ABRAHAM_LINCOLN as string);
        candidates.push(env.ELEVENLABS_VOICE_LINCOLN as string);
        candidates.push(env.ELEVENLABS_ABRAHAM_LINCOLN_VOICE as string);
        break;
    }
    return candidates.find(Boolean);
  }

  private mapToneToVoice(tone: Tone): string {
    if (tone === 'strict') return process.env.ELEVENLABS_VOICE_STRICT || 'voice_strict';
    if (tone === 'light') return process.env.ELEVENLABS_VOICE_LIGHT || 'voice_light';
    return process.env.ELEVENLABS_VOICE_BALANCED || 'voice_balanced';
  }

  async generateVoiceForMentor(text: string, mentor: MentorKey, tone: Tone = 'balanced'): Promise<string | null> {
    const voiceId = this.mapMentorToVoice(mentor) || this.mapToneToVoice(tone);
    return this.synthesizeWithVoiceId(text, voiceId);
  }

  private async synthesizeWithVoiceId(text: string, voiceId: string): Promise<string | null> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || !voiceId) return null;
    try {
      const fetch = (await import('node-fetch')).default as any;
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
      });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    } catch (e) {
      return null;
    }
  }

  private hash(s: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(s).digest('hex');
  }
} 