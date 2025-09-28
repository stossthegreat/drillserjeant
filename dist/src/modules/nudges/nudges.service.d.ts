import { MentorsService, MentorKey } from '../mentors/mentors.service';
export declare class NudgesService {
    private readonly mentors;
    constructor(mentors: MentorsService);
    generateNudge(userId: string): Promise<{
        text: string;
        tone: "strict" | "balanced" | "light";
        mentor: MentorKey;
        voice: {
            url: string;
        };
    }>;
    private mentorFromMode;
    generateChatResponse({ userId, mode, mentor, message, includeVoice }: {
        userId: string;
        mode?: string;
        mentor?: string;
        message: string;
        includeVoice?: boolean;
    }): Promise<{
        reply: string;
        mentor: MentorKey;
        voice: {
            url: string;
        };
    }>;
}
