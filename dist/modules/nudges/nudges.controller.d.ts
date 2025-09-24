import { NudgesService } from './nudges.service';
export declare class NudgesController {
    private readonly nudgesService;
    constructor(nudgesService: NudgesService);
    getNudge(req: any): Promise<any>;
}
