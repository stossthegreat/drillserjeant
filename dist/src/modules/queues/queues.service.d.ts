import { Queue } from 'bullmq';
import { RedisService } from '../infra/redis.service';
export declare class QueuesService {
    readonly notifications: Queue;
    readonly reports: Queue;
    constructor(redis: RedisService);
    enqueueNotification(data: any): Promise<void>;
    enqueueWeeklyReport(userId: string): Promise<void>;
}
