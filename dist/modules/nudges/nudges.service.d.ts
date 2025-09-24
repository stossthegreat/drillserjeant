export declare class NudgesService {
    private mentorProfiles;
    generateNudge(userId: string, habits?: any[], tasks?: any[]): Promise<any>;
    private analyzeContext;
    private classifyUser;
    private generateSmartNudge;
    private calculateTimeFactor;
    generateChatResponse(message: string, mentorKey: string): Promise<any>;
}
