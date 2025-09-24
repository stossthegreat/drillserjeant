export declare class VoiceService {
    generateTTS(text: string, voice?: string): Promise<{
        audioUrl: string;
        voice: string;
        text: string;
        timestamp: string;
    }>;
}
