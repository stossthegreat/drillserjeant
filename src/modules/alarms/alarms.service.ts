import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.alarm.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, body: any) {
    const { label, rrule, tone = 'balanced' } = body || {};
    return this.prisma.alarm.create({ data: { userId, label, rrule, tone } });
  }

  async dismiss(id: string) {
    return this.prisma.alarm.update({ where: { id }, data: { enabled: false } });
  }

  async remove(id: string) {
    await this.prisma.alarm.delete({ where: { id } });
    return { ok: true };
  }
} 