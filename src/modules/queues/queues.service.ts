import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class QueuesService {
  private notificationsQueue: Queue;
  private reportsQueue: Queue;

  constructor(private readonly redis: RedisService) {
    const connection = redis.getClient();
    
    this.notificationsQueue = new Queue('notifications', { connection });
    this.reportsQueue = new Queue('reports', { connection });
  }

  async enqueueNotification(data: {
    userId: string;
    text: string;
    voiceUrl?: string;
    kind?: string;
    mentor?: string;
  }) {
    return this.notificationsQueue.add('send-notification', data);
  }

  async enqueueReport(data: {
    userId: string;
    type: 'weekly' | 'monthly';
    date: string;
  }) {
    return this.reportsQueue.add('generate-report', data);
  }

  async scheduleWeeklyReports() {
    // Schedule weekly reports for all users
    return this.reportsQueue.add('schedule-weekly-reports', {}, {
      repeat: { cron: '0 9 * * 0' }, // Every Sunday at 9 AM
    });
  }
} 