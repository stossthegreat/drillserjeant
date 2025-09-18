import { VoiceService } from './voice.service';
export declare class VoiceController {
    private readonly voiceService;
    constructor(voiceService: VoiceService);
    getPreset(req: any, id: string): Promise<{
        url: any;
        expiresAt: string;
    }>;
    textToSpeech(req: any, body: {
        text: string;
        voice?: string;
    }): Promise<{
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
}
