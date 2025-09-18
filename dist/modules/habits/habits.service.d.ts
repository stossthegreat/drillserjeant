export declare class HabitsService {
    private habits;
    list(userId: string): Promise<{
        id: string;
        userId: string;
        title: string;
        schedule: {
            time: string;
            days: string[];
        };
        streak: number;
        lastTick: any;
        createdAt: string;
    }[]>;
    create(userId: string, data: any): Promise<any>;
    update(id: string, data: any): Promise<{
        id: string;
        userId: string;
        title: string;
        schedule: {
            time: string;
            days: string[];
        };
        streak: number;
        lastTick: any;
        createdAt: string;
    }>;
    tick(userId: string, habitId: string, idempotencyKey?: string): Promise<{
        achievements: any[];
    }>;
    private checkAchievements;
}
