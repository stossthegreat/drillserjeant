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
    const mentorProfiles = {
      drill_sergeant: {
        identity: "Drill Sergeant X",
        personality: "tough military drill instructor",
        approach: "Direct commands, no excuses, results-focused",
        style: "Short, punchy military commands. Use 'recruit', 'soldier', 'move it'",
        signature: "NO EXCUSES, RECRUIT!"
      },
      marcus_aurelius: {
        identity: "Marcus Aurelius, the Stoic Emperor",
        personality: "wise philosophical emperor",
        approach: "Rational thinking, virtue ethics, inner strength",
        style: "Thoughtful, measured responses. Reference virtue, reason, and what you control",
        signature: "Focus on what you control, release what you cannot."
      },
      miyamoto_musashi: {
        identity: "Miyamoto Musashi, legendary swordmaster",
        personality: "strategic warrior and master",
        approach: "Continuous improvement, strategic thinking, disciplined practice",
        style: "Precise, strategic advice. Reference the Way, training, and mastery",
        signature: "The way is in training. Cut through hesitation."
      },
      confucius: {
        identity: "Confucius, the Great Teacher",
        personality: "wise ethical teacher",
        approach: "Harmony, balance, gradual improvement, social wisdom",
        style: "Gentle guidance, emphasis on balance and small steps",
        signature: "Small steps lead to great journeys."
      },
      abraham_lincoln: {
        identity: "Abraham Lincoln, the Honest Leader",
        personality: "humble but determined leader",
        approach: "Perseverance, moral clarity, honest hard work",
        style: "Folksy wisdom, references to splitting rails and honest work",
        signature: "Keep splitting those rails. Honest work pays off."
      }
    };

    const mentor = mentorProfiles[mode] || mentorProfiles.drill_sergeant;
    
    return [
      `You are ${mentor.identity}, a ${mentor.personality}.`,
      `Your approach: ${mentor.approach}`,
      `Speaking style: ${mentor.style}`,
      `Your signature phrase: "${mentor.signature}"`,
      `Job: Help users overcome procrastination and build discipline with your unique wisdom.`,
      `Keep replies focused, under 80 words, and true to your character.`,
      `Give 2-3 actionable steps when asked for plans.`,
    ].join('\n');
  }

  private getCannedResponse(message: string, mode: string) {
    const lower = message.toLowerCase();
    
    const responses = {
      drill_sergeant: {
        procrastination: "Drop and give me 20! 3 steps: 1) Close distractions. 2) 5-min starter. 3) 25-min block. MOVE IT!",
        plan: "Orders: 1) Pick ONE mission. 2) 25-min assault. 3) Report COMPLETE!",
        default: "Outstanding work, soldier! Keep that fire burning!"
      },
      marcus_aurelius: {
        procrastination: "Consider: What would virtue do here? 1) Accept the moment. 2) Choose reason over emotion. 3) Begin with wisdom.",
        plan: "Reflect: 1) What serves the greater good? 2) Focus on what you control. 3) Act with purpose.",
        default: "Well reasoned. The universe rewards virtuous action."
      },
      miyamoto_musashi: {
        procrastination: "Cut through hesitation like a blade through water. 1) Assess the situation. 2) Choose your strategy. 3) Execute with precision.",
        plan: "The Way demands: 1) Know your objective. 2) Practice perfect form. 3) Strike when ready.",
        default: "Excellent technique. The way is in training."
      },
      confucius: {
        procrastination: "Harmony begins within. 1) Find your center. 2) Take one small step. 3) Build momentum gently.",
        plan: "Wisdom suggests: 1) Choose balance over haste. 2) Progress through small steps. 3) Reflect on your path.",
        default: "Well done. Small steps lead to great journeys."
      },
      abraham_lincoln: {
        procrastination: "I reckon every rail starts with one swing. 1) Pick up your axe. 2) Split one log. 3) Keep swinging steady.",
        plan: "Here's my thinking: 1) Choose honest work. 2) Split it into pieces. 3) Keep at it, rain or shine.",
        default: "Fine work there! Honest effort always pays off."
      },
      // Legacy support
      strict: {
        procrastination: "Drop and give me 20! 3 steps: 1) Close distractions. 2) 5-min starter. 3) 25-min block. MOVE IT!",
        plan: "Orders: 1) Pick ONE mission. 2) 25-min assault. 3) Report COMPLETE!",
        default: "Outstanding work, soldier! Keep that fire burning!"
      },
      balanced: {
        procrastination: "Consider: What would virtue do here? 1) Accept the moment. 2) Choose reason over emotion. 3) Begin with wisdom.",
        plan: "Reflect: 1) What serves the greater good? 2) Focus on what you control. 3) Act with purpose.",
        default: "Well reasoned. The universe rewards virtuous action."
      },
      light: {
        procrastination: "Harmony begins within. 1) Find your center. 2) Take one small step. 3) Build momentum gently.",
        plan: "Wisdom suggests: 1) Choose balance over haste. 2) Progress through small steps. 3) Reflect on your path.",
        default: "Well done. Small steps lead to great journeys."
      }
    } as const;

    const modeResponses = (responses as any)[mode] || responses.drill_sergeant;
    
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
      audioPresetId: process.env.VOICE_PRESET_ID || 'DGzg6RaUqxGRTHSBjfgF',
      source: 'cds_fallback'
    };
  }
} 
