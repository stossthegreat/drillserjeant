import { AlarmsService } from './alarms.service';
export declare class AlarmsController {
    private readonly alarmsService;
    constructor(alarmsService: AlarmsService);
    list(req: any): Promise<{
        id: string;
        userId: string;
        label: string;
        rrule: string;
        tone: string;
        enabled: boolean;
        nextRun: string;
        createdAt: string;
    }[]>;
    create(req: any, createData: any): Promise<any>;
    update(id: string, updateData: any): Promise<{
        id: string;
        userId: string;
        label: string;
        rrule: string;
        tone: string;
        enabled: boolean;
        nextRun: string;
        createdAt: string;
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
}
