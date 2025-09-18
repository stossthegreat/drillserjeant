export declare class BillingService {
    private userUsage;
    private userPlans;
    constructor();
    createCheckoutSession(userId: string): Promise<{
        sessionId: string;
        url: string;
        expires: string;
    }>;
    createPortalSession(userId: string): Promise<{
        url: string;
        expires: string;
    }>;
    handleWebhook(body: any, signature: string): Promise<{
        received: boolean;
    }>;
    getUsage(userId: string): Promise<{
        plan: string;
        usage: any;
        limits: any;
        remaining: {
            chatCalls: number;
            ttsChars: number;
        };
        features: {
            canUseDynamicTts: boolean;
            canUseAdvancedChat: boolean;
            maxHabits: any;
            maxAlarms: any;
        };
    }>;
    checkQuota(userId: string, quotaType: 'chat' | 'tts', amount?: number): Promise<boolean>;
    incrementUsage(userId: string, quotaType: 'chat' | 'tts', amount?: number): Promise<void>;
    getUserPlan(userId: string): string;
    private getPlanLimits;
}
