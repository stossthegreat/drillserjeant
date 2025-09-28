import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getWeeklyReport(userId: string, weekISO?: string): Promise<{
        week: string;
        successRate: number;
        deltas: {
            vsLastWeek: number;
        };
        counts: {
            successes: any;
            fails: any;
            skips: any;
        };
        lifeBank: {
            gainedMinutes: number;
            lostMinutes: number;
        };
        rank: {
            xp: number;
            tier: string;
        };
        focusHabit: any;
        heatmap: Record<string, number>;
        commentary: string;
    }>;
    private buildHeatmap;
}
