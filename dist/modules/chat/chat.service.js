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
let ChatService = class ChatService {
    constructor(billing) {
        this.billing = billing;
    }
    async processMessage(userId, body) {
        const { message, mode = 'balanced' } = body;
        const allowed = await this.billing.checkQuota(userId, 'chat', 1);
        if (!allowed) {
            return {
                ...this.getCannedResponse(message, mode),
                error: 'CHAT_QUOTA_EXCEEDED',
                source: 'cds_fallback',
            };
        }
        const response = this.getCannedResponse(message, mode);
        await this.billing.incrementUsage(userId, 'chat', 1);
        return response;
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