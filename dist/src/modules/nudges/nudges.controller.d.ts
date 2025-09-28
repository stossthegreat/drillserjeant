import { NudgesService } from './nudges.service';
export declare class NudgesController {
    private readonly nudges;
    constructor(nudges: NudgesService);
    getNudge(userId?: string): Promise<{
        text: string;
        tone: "strict" | "balanced" | "light";
        mentor: import("../mentors/mentors.service").MentorKey;
        voice: {
            url: string;
        };
    }>;
    chat(body: any): Promise<{
        reply: string;
        mentor: import("../mentors/mentors.service").MentorKey;
        voice: {
            url: string;
        };
    }>;
}
