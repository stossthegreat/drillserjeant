import { VoiceService } from './voice.service';
import { MentorsService } from '../mentors/mentors.service';
export declare class VoiceController {
    private readonly voice;
    private readonly mentors;
    constructor(voice: VoiceService, mentors: MentorsService);
    tts(body: any): Promise<{
        url: string;
    }>;
    preset(id: string): Promise<{
        url: string;
        expiresAt: string;
        message?: undefined;
    } | {
        url: any;
        message: string;
        expiresAt: string;
    }>;
    preload(body: any): Promise<{
        cached: number;
    }>;
}
