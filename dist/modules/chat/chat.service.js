"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("../billing/billing.service");
let OpenAI = null;
try {
    OpenAI = require('openai').OpenAI;
}
catch (_) { }
let ChatService = class ChatService {
    constructor(billing) {
        this.billing = billing;
    }
    async processMessage(userId, body) {
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
                    ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: String(m.text || m.content || '') })),
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
            }
            catch (err) {
                console.error('Chat OpenAI error:', err);
            }
        }
        const response = this.getCannedResponse(message, mode);
        await this.billing.incrementUsage(userId, 'chat', 1);
        return response;
    }
    buildSystemPrompt(mode) {
        const tone = mode === 'strict' ? 'harsh Drill Sergeant' : mode === 'light' ? 'calm zen coach' : 'motivational coach';
        return [
            `You are Drill Sergeant X, a ${tone} who speaks in short, punchy phrases.`,
            `Your job: enforce discipline, overcome procrastination, and keep the user moving.`,
            `Be direct. Avoid fluff. Give 2-4 actionable steps. Use present-tense commands.`,
            `When user asks for plan, produce a fast 3-step plan. When user drifts, snap them back.`,
            `Never apologize. Keep replies under 80 words.`,
        ].join('\n');
    }
    getCannedResponse(message, mode) {
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
        };
        const modeResponses = responses[mode] || responses.balanced;
        let reply = modeResponses.default;
        if (lower.includes('procrast')) {
            reply = modeResponses.procrastination;
        }
        else if (lower.includes('plan')) {
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], ChatService);
//# sourceMappingURL=chat.service.js.map