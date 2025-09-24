export declare class NudgesService {
    private mentors;
    generateNudge(userId: string): Promise<{
        nudge: {
            type: string;
            message: string;
            mentorId: string;
            mentorName: string;
            progressPercent: number;
            timestamp: string;
        };
    }>;
}
