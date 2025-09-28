import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyReport(userId: string, weekISO?: string) {
    const now = new Date();
    const end = now;
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.event.findMany({
      where: { userId, ts: { gte: start, lte: end } },
      orderBy: { ts: 'asc' },
    });

    const habits = await this.prisma.habit.findMany({ where: { userId } });

    const total = habits.length * 7 || 1;
    const successes = events.filter(e => e.type === 'habit_success').length;
    const fails = events.filter(e => e.type === 'habit_fail').length;
    const skips = events.filter(e => e.type === 'habit_skip').length;
    const successRate = Math.round((successes / total) * 100);

    const xp = successes * 10 - fails * 5;
    const rank = xp >= 500 ? 'Gold' : xp >= 200 ? 'Silver' : 'Bronze';

    return {
      week: weekISO || `${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}`,
      successRate,
      deltas: { vsLastWeek: 0 },
      counts: { successes, fails, skips },
      lifeBank: { gainedMinutes: successes * 25, lostMinutes: fails * 25 },
      rank: { xp, tier: rank },
      focusHabit: habits[0]?.title || 'Focus',
      heatmap: this.buildHeatmap(events),
      commentary: `Solid work. Success rate ${successRate}%—focus on consistent reps.`,
    };
  }

  private buildHeatmap(events: any[]) {
    const map: Record<string, number> = {};
    for (const e of events) {
      const day = new Date(e.ts).toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + (e.type === 'habit_success' ? 1 : 0);
    }
    return map;
  }
} 