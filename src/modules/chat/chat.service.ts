import { Injectable, ForbiddenException } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ChatService {
  constructor(private readonly billing: BillingService) {}

  async processMessage(userId: string, body: { message: string; mode?: string; history?: any[] }) {
    const { message, mode = 'balanced' } = body;

    // Quota check
    const allowed = await this.billing.checkQuota(userId, 'chat', 1);
    if (!allowed) {
      // Return CDS fallback with 402 hint
      return {
        ...this.getCannedResponse(message, mode),
        error: 'CHAT_QUOTA_EXCEEDED',
        source: 'cds_fallback',
      };
    }

    // TODO: OpenAI integration (with timeout and validation). For now, CDS fallback.
    const response = this.getCannedResponse(message, mode);

    await this.billing.incrementUsage(userId, 'chat', 1);
    return response;
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
      source: 'cds_fallback'
    };
  }
}
