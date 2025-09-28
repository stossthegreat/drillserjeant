import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    weekly(req: any, week?: string): Promise<{
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
}
