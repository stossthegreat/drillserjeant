import { StreaksService } from './streaks.service';
export declare class StreaksController {
    private readonly streaksService;
    constructor(streaksService: StreaksService);
    getAchievements(req: any): Promise<{
        achievements: any[];
        totalXP: any;
        level: number;
        rank: string;
        pendingCelebrations: any[];
    }>;
    getStreakSummary(req: any): Promise<{
        overall: number;
        categories: {
            id: string;
            name: string;
            days: number;
        }[];
    }>;
}
