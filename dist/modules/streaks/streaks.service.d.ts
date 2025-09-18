export declare class StreaksService {
    private achievements;
    private userAchievements;
    private pendingCelebrations;
    checkAchievements(userId: string, habitId: string, currentStreak: number): Promise<any[]>;
    getUserAchievements(userId: string): Promise<{
        achievements: any[];
        totalXP: any;
        level: number;
        rank: string;
        pendingCelebrations: any[];
    }>;
    getStreakSummary(userId: string): Promise<{
        overall: number;
        categories: {
            id: string;
            name: string;
            days: number;
        }[];
    }>;
    private getStreakAchievementKey;
    private getRankByLevel;
    private queueCelebration;
    private generateId;
}
