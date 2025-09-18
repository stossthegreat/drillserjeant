import { Injectable } from '@nestjs/common';

@Injectable()
export class AlarmsService {
  private alarms = [
    {
      id: 'alarm-1',
      userId: 'demo-user-123',
      label: 'Morning Workout',
      rrule: 'FREQ=DAILY;BYHOUR=7;BYMINUTE=0',
      tone: 'balanced',
      enabled: true,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  async list(userId: string) {
    return this.alarms.filter(a => a.userId === userId);
  }

  async create(userId: string, data: any) {
    const alarm = {
      id: `alarm-${Date.now()}`,
      userId,
      ...data,
      enabled: true,
      nextRun: this.calculateNextRun(data.rrule),
      createdAt: new Date().toISOString(),
    };
    this.alarms.push(alarm);
    return alarm;
  }

  async update(id: string, data: any) {
    const index = this.alarms.findIndex(a => a.id === id);
    if (index >= 0) {
      this.alarms[index] = { 
        ...this.alarms[index], 
        ...data,
        nextRun: data.rrule ? this.calculateNextRun(data.rrule) : this.alarms[index].nextRun
      };
      return this.alarms[index];
    }
    throw new Error('Alarm not found');
  }

  async delete(id: string) {
    const index = this.alarms.findIndex(a => a.id === id);
    if (index >= 0) {
      this.alarms.splice(index, 1);
      return { deleted: true };
    }
    throw new Error('Alarm not found');
  }

  private calculateNextRun(rrule: string): string {
    // Simple mock - will implement proper RRULE parsing later
    console.log(`Calculating next run for RRULE: ${rrule}`);
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
} 