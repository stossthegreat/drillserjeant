import { BillingService } from '../billing/billing.service';
export declare class ChatService {
    private readonly billing;
    constructor(billing: BillingService);
    processMessage(userId: string, body: {
        message: string;
        mode?: string;
        history?: any[];
    }): Promise<{
        reply: any;
        updates: any[];
        suggested_actions: ({
            type: string;
            time: string;
            message: string;
        } | {
            type: string;
            message: string;
            time?: undefined;
        })[];
        confidence: number;
        source: string;
    } | {
        error: string;
        source: string;
        reply: any;
        updates: any[];
        suggested_actions: ({
            type: string;
            time: string;
            message: string;
        } | {
            type: string;
            message: string;
            time?: undefined;
        })[];
        confidence: number;
    }>;
    private getCannedResponse;
}
