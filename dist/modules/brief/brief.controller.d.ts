import { BriefService } from './brief.service';
export declare class BriefController {
    private readonly briefService;
    constructor(briefService: BriefService);
    getTodaysBrief(req: any): Promise<{
        user: {
            rank: string;
            xp: any;
            level: number;
        };
        missions: {
            id: string;
            title: string;
            streak: number;
            status: string;
            due: string;
            nextMilestone: number;
            daysToMilestone: number;
        }[];
        riskBanners: {
            type: string;
            habitId: string;
            message: string;
            urgency: string;
        }[];
        weeklyTarget: {
            current: number;
            goal: number;
        };
        achievements: any[];
        streaksSummary: {
            overall: number;
            categories: {
                id: string;
                name: string;
                days: number;
            }[];
        };
        pendingCelebrations: any[];
        nudges: any[];
    }>;
}
