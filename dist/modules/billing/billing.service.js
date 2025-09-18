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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
let BillingService = class BillingService {
    constructor() {
        this.userUsage = new Map();
        this.userPlans = new Map();
        this.userPlans.set('demo-user-123', 'FREE');
        this.userUsage.set('demo-user-123', {
            chatCallsToday: 5,
            ttsCharsToday: 150,
            chatCallsThisMonth: 45,
            ttsCharsThisMonth: 2100
        });
    }
    async createCheckoutSession(userId) {
        console.log(`Creating checkout session for user ${userId}`);
        return {
            sessionId: 'cs_mock_' + Date.now(),
            url: 'https://checkout.stripe.com/pay/mock_session',
            expires: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
    }
    async createPortalSession(userId) {
        console.log(`Creating portal session for user ${userId}`);
        const userPlan = this.userPlans.get(userId) || 'FREE';
        if (userPlan === 'FREE') {
            throw new common_1.ForbiddenException('Customer portal requires active subscription');
        }
        return {
            url: 'https://billing.stripe.com/p/login/mock_portal',
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
    }
    async handleWebhook(body, signature) {
        console.log('Processing Stripe webhook:', body?.type || 'unknown');
        if (body.type === 'customer.subscription.created' || body.type === 'invoice.payment_succeeded') {
            const userId = body.data?.object?.metadata?.userId || 'demo-user-123';
            this.userPlans.set(userId, 'PRO');
            console.log(`✅ User ${userId} upgraded to PRO`);
        }
        else if (body.type === 'customer.subscription.deleted') {
            const userId = body.data?.object?.metadata?.userId || 'demo-user-123';
            this.userPlans.set(userId, 'FREE');
            console.log(`❌ User ${userId} downgraded to FREE`);
        }
        return { received: true };
    }
    async getUsage(userId) {
        const usage = this.userUsage.get(userId) || {
            chatCallsToday: 0,
            ttsCharsToday: 0,
            chatCallsThisMonth: 0,
            ttsCharsThisMonth: 0
        };
        const plan = this.userPlans.get(userId) || 'FREE';
        const limits = this.getPlanLimits(plan);
        return {
            plan,
            usage,
            limits,
            remaining: {
                chatCalls: Math.max(0, limits.chatCallsPerDay - usage.chatCallsToday),
                ttsChars: Math.max(0, limits.ttsCharsPerDay - usage.ttsCharsToday)
            },
            features: {
                canUseDynamicTts: plan === 'PRO',
                canUseAdvancedChat: plan === 'PRO',
                maxHabits: limits.maxHabits,
                maxAlarms: limits.maxAlarms
            }
        };
    }
    async checkQuota(userId, quotaType, amount = 1) {
        const usage = this.userUsage.get(userId) || { chatCallsToday: 0, ttsCharsToday: 0 };
        const plan = this.userPlans.get(userId) || 'FREE';
        const limits = this.getPlanLimits(plan);
        if (quotaType === 'chat') {
            return usage.chatCallsToday < limits.chatCallsPerDay;
        }
        else if (quotaType === 'tts') {
            return (usage.ttsCharsToday + amount) <= limits.ttsCharsPerDay;
        }
        return false;
    }
    async incrementUsage(userId, quotaType, amount = 1) {
        const usage = this.userUsage.get(userId) || {
            chatCallsToday: 0,
            ttsCharsToday: 0,
            chatCallsThisMonth: 0,
            ttsCharsThisMonth: 0
        };
        if (quotaType === 'chat') {
            usage.chatCallsToday += amount;
            usage.chatCallsThisMonth += amount;
        }
        else if (quotaType === 'tts') {
            usage.ttsCharsToday += amount;
            usage.ttsCharsThisMonth += amount;
        }
        this.userUsage.set(userId, usage);
        console.log(`📊 Usage updated for ${userId}: ${quotaType} +${amount}`);
    }
    getUserPlan(userId) {
        return this.userPlans.get(userId) || 'FREE';
    }
    getPlanLimits(plan) {
        const limits = {
            FREE: {
                chatCallsPerDay: 20,
                ttsCharsPerDay: 500,
                maxHabits: 5,
                maxAlarms: 3,
                maxAntiHabits: 2
            },
            PRO: {
                chatCallsPerDay: 200,
                ttsCharsPerDay: 10000,
                maxHabits: 50,
                maxAlarms: 20,
                maxAntiHabits: 10
            }
        };
        return limits[plan] || limits.FREE;
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BillingService);
//# sourceMappingURL=billing.service.js.map