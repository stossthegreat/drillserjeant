import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: string, payload: any) {
    return this.prisma.event.create({ data: { userId, type, payload } });
  }

  async list(userId: string, limit: number = 100) {
    return this.prisma.event.findMany({ where: { userId }, orderBy: { ts: 'desc' }, take: limit });
  }
} 