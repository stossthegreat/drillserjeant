import { HabitsService } from './habits.service';
export declare class HabitsController {
    private readonly habits;
    constructor(habits: HabitsService);
    list(req: any): Promise<any>;
    tick(req: any, id: string): Promise<{
        ok: boolean;
        habit: any;
    }>;
}
