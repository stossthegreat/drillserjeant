import { AlarmsService } from './alarms.service';
export declare class AlarmsController {
    private readonly alarms;
    constructor(alarms: AlarmsService);
    list(req: any): Promise<any>;
    create(req: any, body: any): Promise<any>;
    dismiss(id: string): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
