import { VoiceService } from '../voice/voice.service';
export declare class NudgesService {
    private readonly voiceService;
    constructor(voiceService: VoiceService);
    private mentorProfiles;
    generateNudge(userId: string): Promise<any>;
    generateChatResponse(message: string, mentorKey: string, includeVoice?: boolean): Promise<any>;
}
