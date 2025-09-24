import { HabitsService } from '../habits/habits.service';
import { TasksService } from '../tasks/tasks.service';
export declare class ReportsService {
    private readonly habitsService;
    private readonly tasksService;
    constructor(habitsService: HabitsService, tasksService: TasksService);
    generateMorningBrief(userId: string): Promise<{
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
    generateEveningSummary(userId: string): Promise<{
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
    generateDailyReport(userId: string, date?: string): Promise<{
        type: string;
        date: string;
        summary: string;
        habits: number;
        tasks: number;
        timestamp: string;
    }>;
    generateWeeklyReport(userId: string, week?: string): Promise<{
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
    private generateMorningInsights;
    private generateEveningInsights;
    private generateMorningMotivation;
    private generateEveningReflection;
    private analyzeStreakStatus;
    private identifyRiskFactors;
    private identifyOpportunities;
    private identifyDailyAchievements;
    private identifyImprovements;
    private generateTomorrowRecommendations;
    private identifyTomorrowRisks;
    private calculateGrade;
    private calculateConsistency;
    private getWeatherAlert;
    private identifyFocusArea;
    private getCurrentWeek;
}
