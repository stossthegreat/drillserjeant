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

    const habits = await this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });

    return {
      date: start.toISOString().slice(0, 10),
      habits,
      tasks: [],
      nudge: nudge?.payload || null,
    };
  }
} 