import { NudgesService } from './nudges.service';
export declare class NudgesController {
    private readonly nudgesService;
    constructor(nudgesService: NudgesService);
    getNudge(req: any): Promise<{
        nudge: {
            type: string;
            message: string;
            mentorId: string;
            mentorName: string;
            progressPercent: number;
            timestamp: string;
        };
    }>;
}
