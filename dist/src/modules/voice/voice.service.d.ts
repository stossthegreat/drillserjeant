export declare class VoiceService {
    constructor();
    getPreset(id: string): Promise<{
        url: string;
        expiresAt: string;
        message?: undefined;
    } | {
        url: any;
        message: string;
        expiresAt: string;
    }>;
    private generateTTS;
}
