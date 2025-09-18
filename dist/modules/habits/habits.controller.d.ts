import { HabitsService } from './habits.service';
export declare class HabitsController {
    private readonly habitsService;
    constructor(habitsService: HabitsService);
    list(req: any): Promise<{
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
    create(req: any, createData: any): Promise<any>;
    update(id: string, updateData: any): Promise<{
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
    tick(req: any, id: string): Promise<{
        ok: boolean;
        timestamp: string;
    }>;
}
