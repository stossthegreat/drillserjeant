export declare class AlarmsService {
    private alarms;
    list(userId: string): Promise<{
        id: string;
        userId: string;
        label: string;
        rrule: string;
        tone: string;
        enabled: boolean;
        nextRun: string;
        createdAt: string;
    }[]>;
    create(userId: string, data: any): Promise<any>;
    update(id: string, data: any): Promise<{
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
    private calculateNextRun;
}
