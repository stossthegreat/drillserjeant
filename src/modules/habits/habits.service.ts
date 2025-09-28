import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async create(userId: string, body: any) {
    const title = (body.title || body.name || '').toString().trim();
    if (!title) {
      throw new Error('title is required');
    }

    const scheduleInput = body.schedule || normalizeSchedule(body);

    const created = await this.prisma.habit.create({
      data: {
        userId,
        title,
        schedule: scheduleInput,
      },
    });
    return created;
  }

  async tick(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      throw new Error('Habit not found');
    }

    const now = new Date();
    const last = habit.lastTick ? new Date(habit.lastTick) : null;
    const alreadyToday = !!last &&
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate();

    if (alreadyToday) {
      return { ok: true, idempotent: true, streak: habit.streak, timestamp: habit.lastTick };
    }

    const updated = await this.prisma.habit.update({
      where: { id: habitId },
      data: { lastTick: now, streak: { increment: 1 } },
    });

    await this.prisma.event.create({ data: { userId, type: 'habit_success', payload: { habitId } } });
    return { ok: true, idempotent: false, streak: updated.streak, timestamp: updated.lastTick };
  }

  async delete(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      throw new Error('Habit not found');
    }
    await this.prisma.habit.delete({ where: { id: habitId } });
    await this.prisma.event.create({ data: { userId, type: 'habit_deleted', payload: { habitId } } });
    return { ok: true };
  }
}

function normalizeSchedule(body: any) {
  const frequency = (body.frequency || body.type || body.kind || 'daily').toString();
  const startDate = body.startDate || body.from;
  const endDate = body.endDate || body.to;
  const days = Array.isArray(body.days) ? body.days : undefined;

  const schedule: any = {};
  if (startDate) schedule.from = startDate;
  if (endDate) schedule.to = endDate;

  switch (frequency) {
    case 'alldays':
    case 'all':
    case 'daily':
      schedule.kind = 'alldays';
      break;
    case 'weekdays':
      schedule.kind = 'weekdays';
      break;
    case 'custom':
      schedule.kind = 'custom';
      schedule.days = (days || []).map((d: any) => Number(d)).filter((n: number) => n >= 1 && n <= 7);
      break;
    default:
      schedule.kind = frequency;
      break;
  }

  return schedule;
} 