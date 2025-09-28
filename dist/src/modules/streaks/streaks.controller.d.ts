import { StreaksService } from './streaks.service';
export declare class StreaksController {
    private readonly streaks;
    constructor(streaks: StreaksService);
    achievements(req: any): Promise<any>;
    summary(req: any): Promise<any>;
}
