import { BriefService } from './brief.service';
export declare class BriefController {
    private readonly brief;
    constructor(brief: BriefService);
    today(userId?: string): Promise<{
        date: string;
        habits: any;
        tasks: any[];
        nudge: any;
    }>;
    root(userId?: string): Promise<{
        date: string;
        habits: any;
        tasks: any[];
        nudge: any;
    }>;
}
