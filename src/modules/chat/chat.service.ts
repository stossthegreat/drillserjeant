import { Injectable, ForbiddenException } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

// Lazy import to avoid hard dependency when no key is set
let OpenAI: any = null;
try { OpenAI = require('openai').OpenAI; } catch (_) {}

@Injectable()
export class ChatService {
  constructor(private readonly billing: BillingService) {}

  async processMessage(userId: string, body: { message: string; mode?: string; history?: any[] }) {
    const { message, mode = 'balanced', history = [] } = body;
    
    const allowed = await this.billing.checkQuota(userId, 'chat', 1);
    if (!allowed) {
      return {
        ...this.getCannedResponse(message, mode),
        error: 'CHAT_QUOTA_EXCEEDED',
        source: 'cds_fallback',
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && OpenAI) {
      try {
        const client = new OpenAI({ apiKey });
        const sysPrompt = this.buildSystemPrompt(mode);
        const messages = [
          { role: 'system', content: sysPrompt },
          ...history.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.text || m.content || '') })),
          { role: 'user', content: String(message) },
        ];

        const res = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 300,
        });

        const text = res.choices?.[0]?.message?.content?.trim() || this.getCannedResponse(message, mode).reply;
        const response = {
          reply: text,
          updates: [],
          suggested_actions: [
            { type: 'start_timer', time: '25:00', message: 'Start focus session' },
            { type: 'quick_commit', message: 'Set 1-hour goal' }
          ],
          confidence: 0.9,
          audioPresetId: process.env.VOICE_PRESET_ID || 'DGzg6RaUqxGRTHSBjfgF',
          source: 'openai',
        };

        await this.billing.incrementUsage(userId, 'chat', 1);
        return response;
      } catch (err) {
        console.error('Chat OpenAI error:', err);
        // fallthrough to canned
      }
    }

    const response = this.getCannedResponse(message, mode);
    await this.billing.incrementUsage(userId, 'chat', 1);
    return response;
  }

  private buildSystemPrompt(mode: string) {
    const tone = mode === 'strict' ? 'harsh Drill Sergeant' : mode === 'light' ? 'calm zen coach' : 'motivational coach';
    return [
      `You are Drill Sergeant X, a ${tone} who speaks in short, punchy phrases.`,
      `Your job: enforce discipline, overcome procrastination, and keep the user moving.`,
      `Be direct. Avoid fluff. Give 2-4 actionable steps. Use present-tense commands.`,
      `When user asks for plan, produce a fast 3-step plan. When user drifts, snap them back.`,
      `Never apologize. Keep replies under 80 words.`,
    ].join('\n');
  }

  private getCannedResponse(message: string, mode: string) {
    const lower = message.toLowerCase();
    
    const responses = {
      strict: {
        procrastination: "Quit whining. 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. Move.",
        plan: "Plan: 1) Pick one task. 2) 25‑min focus. 3) Report DONE.",
        default: "Outstanding. Keep that fire."
      },
      balanced: {
        procrastination: "Reset: one small rep, then a clean 25. You got this.",
        plan: "Pick the next best task, lock a 25, debrief in one sentence.",
        default: "Nice rep—stack another."
      },
      light: {
        procrastination: "Notice the resistance. One mindful step, then begin a 25 minute sit.",
        plan: "Choose one task. Breathe. Begin with presence.",
        default: "Calm power."
      }
    } as const;

    const modeResponses = (responses as any)[mode] || responses.balanced;
    
    let reply = modeResponses.default;
    if (lower.includes('procrast')) {
      reply = modeResponses.procrastination;
    } else if (lower.includes('plan')) {
      reply = modeResponses.plan;
    }

    return {
      reply,
      updates: [],
      suggested_actions: [
        { type: 'start_timer', time: '25:00', message: 'Start focus session' },
        { type: 'quick_commit', message: 'Set 1-hour goal' }
      ],
      confidence: 0.8,
      audioPresetId: 'DGzg6RaUqxGRTHSBjfgF',
      source: 'cds_fallback'
    };
  }
} 
