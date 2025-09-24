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
        text: string;
        timestamp: string;
    }>;
}
