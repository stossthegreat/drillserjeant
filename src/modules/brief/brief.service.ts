import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MentorsService } from '../mentors/mentors.service';
import { QueuesService } from '../queues/queues.service';

@Injectable()
export class BriefService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mentors: MentorsService,
    private readonly queues: QueuesService,
  ) {}

  async getToday(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();

    const events = await this.prisma.event.findMany({
      where: { userId, ts: { gte: start, lte: end } },
      orderBy: { ts: 'desc' },
      take: 100,
    });

    const latestNudge = events.find(e => e.type.startsWith('mentor_')) || null;

    // If no nudge today, generate a primer now
    let nudge = latestNudge;
    if (!nudge) {
      const gen = await this.mentors.generateMentorLine(userId, 'primer');
      nudge = await this.prisma.event.create({
        data: { userId, type: 'mentor_primer', payload: gen },
      });
      await this.queues.enqueueNotification({ userId, text: gen.text, voiceUrl: gen.voiceUrl, kind: 'primer', mentor: gen.mentor });
    }

    let habits = await this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    habits = habits.filter(h => this.isScheduledToday(h.schedule));

    // Pass through reminder fields if encoded inside schedule json
    const enrichedHabits = habits.map(h => {
      const s: any = typeof h.schedule === 'string' ? safeJsonParse(h.schedule) : (h.schedule || {});
      return {
        ...h,
        reminderEnabled: s.reminderEnabled ?? false,
        reminderTime: s.reminderTime ?? null,
      };
    });

    return {
      date: start.toISOString().slice(0, 10),
      habits: enrichedHabits,
      tasks: [],
      nudge: nudge?.payload || null,
    };
  }

  private isScheduledToday(schedule: any): boolean {
    try {
      const s = typeof schedule === 'string' ? JSON.parse(schedule) : (schedule || {});
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dayIdx = ((today.getDay() + 6) % 7) + 1; // 1=Mon .. 7=Sun
      const from = s.from ? new Date(s.from) : null;
      const to = s.to ? new Date(s.to) : null;
      if (from && today < new Date(from.setHours(0,0,0,0))) return false;
      if (to && today > new Date(to.setHours(23,59,59,999))) return false;
      const kind = (s.kind || s.type || '').toString();
      if (kind === 'alldays') return true;
      if (kind === 'weekdays') return dayIdx <= 5;
      if (kind === 'everyN') {
        const n = Number(s.everyN || s.n || 1);
        const anchor = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : todayStart;
        const diffDays = Math.floor((todayStart.getTime() - anchor.getTime()) / (24 * 60 * 60 * 1000));
        return diffDays >= 0 && n >= 1 && (diffDays % n === 0);
      }
      const days: number[] = Array.isArray(s.days) ? s.days.map((d:any)=>Number(d)).filter((n:any)=>n>=1&&n<=7) : [];
      if (days.length === 0 && !kind) return true; // no schedule means always
      return days.includes(dayIdx);
    } catch {
      return true;
    }
  }
}

function safeJsonParse(v: any) {
  try { return JSON.parse(v); } catch { return {}; }
} 