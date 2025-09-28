import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, type: string, payload: any = {}) {
    return this.prisma.event.create({ data: { userId, type, payload } });
  }

  async list(userId: string, limit = 100) {
    return this.prisma.event.findMany({ where: { userId }, orderBy: { ts: 'desc' }, take: limit });
  }
} 