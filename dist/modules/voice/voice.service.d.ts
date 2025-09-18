import { BillingService } from '../billing/billing.service';
export declare class VoiceService {
    private readonly billing;
    constructor(billing: BillingService);
    getPreset(id: string): Promise<{
        url: any;
        expiresAt: string;
    }>;
    synthesize(userId: string, text: string, voice?: string): Promise<{
        url: any;
        cached: boolean;
        expiresAt: string;
        usage?: undefined;
    } | {
        url: string;
        cached: boolean;
        expiresAt: string;
        usage: {
            charsUsed: number;
            charsRemaining: number;
        };
    }>;
    private generateCacheKey;
    private checkCache;
    private generateTTS;
    private cacheResult;
    private getVoiceId;
}
