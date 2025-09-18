import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    createCheckoutSession(req: any): Promise<{
        sessionId: string;
        url: string;
        expires: string;
    }>;
    createPortalSession(req: any): Promise<{
        url: string;
        expires: string;
    }>;
    handleWebhook(body: any, signature: string): Promise<{
        received: boolean;
    }>;
    getUsage(req: any): Promise<{
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
}
