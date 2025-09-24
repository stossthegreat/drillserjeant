import { VoiceService } from './voice.service';
export declare class VoiceController {
    private readonly voiceService;
    constructor(voiceService: VoiceService);
    generateTTS(body: {
        text: string;
        voice?: string;
    }): Promise<{
        audioUrl: string;
        voice: string;
        voiceId: any;
        text: string;
        source: string;
        timestamp: string;
        charCount?: undefined;
        error?: undefined;
    } | {
        audioUrl: string;
        voice: string;
        voiceId: any;
        text: string;
        source: string;
        charCount: number;
        timestamp: string;
        error?: undefined;
    } | {
        audioUrl: string;
        voice: string;
        voiceId: any;
        text: string;
        source: string;
        error: any;
        timestamp: string;
        charCount?: undefined;
    }>;
}
