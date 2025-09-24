import { NudgesService } from './nudges.service';
export declare class NudgesController {
    private readonly nudgesService;
    constructor(nudgesService: NudgesService);
    getNudge(): Promise<any>;
    sendChatMessage(body: any): Promise<{
        reply: any;
        mentor: any;
        voice: {
            url: any;
            voiceId: any;
            source: any;
        };
        audioPresetId: any;
        timestamp: string;
    }>;
}
