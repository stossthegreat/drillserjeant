import { HabitsService } from './habits.service';
export declare class HabitsController {
    private readonly habitsService;
    constructor(habitsService: HabitsService);
    list(): Promise<{
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
    }[]>;
    create(habitData: any): Promise<any>;
    tick(id: string): Promise<{
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
    }>;
    update(id: string, updateData: any): Promise<{
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
    }>;
}
