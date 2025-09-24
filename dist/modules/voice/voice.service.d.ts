export declare class VoiceService {
    private readonly elevenLabsApiKey;
    private readonly mentorVoices;
    generateTTS(text: string, mentor?: string): Promise<{
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
    getMentorVoices(): string[];
    testVoice(mentor?: string): Promise<{
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
