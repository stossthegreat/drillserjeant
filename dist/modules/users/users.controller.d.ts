import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        id: string;
        email: string;
        tone: string;
        intensity: number;
        consentRoast: boolean;
        plan: string;
        features: {
            canUseDynamicTts: boolean;
            llmQuotaRemaining: number;
            ttsQuotaRemaining: number;
        };
    }>;
    updateMe(req: any, updateData: any): Promise<any>;
}
