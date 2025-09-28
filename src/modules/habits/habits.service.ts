import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async tick(userId: string, habitId: string) {
    const now = new Date();
    const habit = await this.prisma.habit.update({ where: { id: habitId }, data: { lastTick: now, streak: { increment: 1 } } });
    await this.prisma.event.create({ data: { userId, type: 'habit_success', payload: { habitId } } });
    return { ok: true, habit };
  }
} 