import { NudgesService } from './nudges.service';
export declare class NudgesController {
    private readonly nudgesService;
    constructor(nudgesService: NudgesService);
    getNudge(): Promise<{
        nudge: any;
        mentor: any;
        type: any;
        voice: {
            url: any;
            voiceId: any;
            source: any;
        };
        timestamp: any;
    }>;
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
