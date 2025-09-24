import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDailyReport(date?: string): Promise<{
        type: string;
        date: string;
        summary: string;
        habits: number;
        tasks: number;
        timestamp: string;
    }>;
    getWeeklyReport(week?: string): Promise<{
        type: string;
        week: string;
        overview: {
            totalHabits: number;
            activeStreaks: number;
            longestStreak: number;
            weeklyConsistency: number;
        };
        patterns: {
            strongDays: string[];
            weakDays: string[];
            peakTime: string;
            insights: string[];
        };
        recommendations: string[];
        timestamp: string;
    }>;
    getMorningBrief(): Promise<{
        type: string;
        date: string;
        dayName: string;
        yesterday: {
            habitsCompleted: number;
            performance: string;
        };
        today: {
            targetHabits: number;
            priorityTasks: {
                id: string;
                userId: string;
                title: string;
                description: string;
                dueDate: string;
                completed: boolean;
                completedAt: any;
                createdAt: string;
            }[];
            weatherAlert: string;
            focusArea: string;
        };
        insights: {
            momentum: string;
            streakStatus: string;
            riskFactors: string[];
            opportunities: string[];
        };
        motivation: string;
        timestamp: string;
    }>;
    getEveningSummary(): Promise<{
        type: string;
        date: string;
        performance: {
            habitsCompleted: number;
            tasksCompleted: number;
            habitScore: number;
            taskScore: number;
            overallScore: number;
            grade: string;
        };
        achievements: string[];
        improvements: string[];
        tomorrow: {
            recommendations: string[];
            riskAlerts: string[];
        };
        insights: {
            momentum: string;
            consistency: number;
            productivityPattern: string;
        };
        reflection: string;
        timestamp: string;
    }>;
}
