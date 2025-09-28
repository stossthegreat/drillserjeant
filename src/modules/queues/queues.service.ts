import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class QueuesService {
  readonly notifications: Queue;
  readonly reports: Queue;

  constructor(redis: RedisService) {
    const connection = redis.getClient();
    this.notifications = new Queue('notifications', { connection });
    this.reports = new Queue('reports', { connection });
  }

  async enqueueNotification(data: any) {
    await this.notifications.add('notify', data, { removeOnComplete: true, attempts: 3 });
  }

  async enqueueWeeklyReport(userId: string) {
    await this.reports.add('weekly_report', { userId }, { removeOnComplete: true, attempts: 3 });
  }
} 