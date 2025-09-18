import { HabitsService } from '../habits/habits.service';
import { StreaksService } from '../streaks/streaks.service';
export declare class BriefService {
    private habitsService;
    private streaksService;
    constructor(habitsService: HabitsService, streaksService: StreaksService);
    getTodaysBrief(userId: string): Promise<{
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
    private getNextMilestone;
    private calculateWeeklyProgress;
    private generateNudges;
}
