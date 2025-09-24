import { HabitsService } from '../habits/habits.service';
import { TasksService } from '../tasks/tasks.service';
export declare class BriefService {
    private readonly habitsService;
    private readonly tasksService;
    constructor(habitsService: HabitsService, tasksService: TasksService);
    getTodaysBrief(userId: string): Promise<{
        user: {
            rank: string;
            xp: number;
            streakDays: number;
        };
        missions: {
            id: string;
            title: string;
            progress: number;
            target: number;
        }[];
        achievements: {
            id: string;
            name: string;
        }[];
        targets: {
            habitsCompleted: number;
            tasksCompleted: number;
            streakDays: number;
        };
        habits: {
            id: string;
            userId: string;
            title: string;
            streak: number;
            schedule: {
                time: string;
                days: string[];
            };
            lastTick: string;
            context: {
                difficulty: number;
                category: string;
                lifeDays: number;
            };
            color: string;
            reminderEnabled: boolean;
            reminderTime: string;
            createdAt: string;
        }[];
        tasks: {
            id: string;
            userId: string;
            title: string;
            description: string;
            dueDate: string;
            completed: boolean;
            completedAt: any;
            createdAt: string;
        }[];
        today: ({
            type: string;
            id: string;
            userId: string;
            title: string;
            streak: number;
            schedule: {
                time: string;
                days: string[];
            };
            lastTick: string;
            context: {
                difficulty: number;
                category: string;
                lifeDays: number;
            };
            color: string;
            reminderEnabled: boolean;
            reminderTime: string;
            createdAt: string;
        } | {
            type: string;
            id: string;
            userId: string;
            title: string;
            description: string;
            dueDate: string;
            completed: boolean;
            completedAt: any;
            createdAt: string;
        })[];
    }>;
    private isCompletedToday;
}
