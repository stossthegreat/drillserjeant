import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import { MentorsService } from '../mentors/mentors.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueuesService,
    private readonly mentors: MentorsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async morningPrimer() {
    await this.generateAndStoreLine('primer');
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async middayScan() {
    await this.generateAndStoreLine('midday_scan');
  }

  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async eveningReflection() {
    await this.generateAndStoreLine('evening_reflection');
  }

  @Cron(CronExpression.EVERY_SUNDAY_AT_1AM)
  async weeklyReport() {
    await this.queues.enqueueWeeklyReport('demo-user-123');
  }

  @Cron('0 0 15 * * *')
  async randomInterruption() {
    await this.generateAndStoreLine('random_interrupt');
  }

  private async generateAndStoreLine(kind: string) {
    const userId = 'demo-user-123';
    const { text, voice, voiceUrl, mentor } = await this.mentors.generateMentorLine(userId, kind);
    await this.prisma.event.create({
      data: {
        userId,
        type: `mentor_${kind}`,
        payload: { text, voice, voiceUrl, mentor },
      },
    });
    await this.queues.enqueueNotification({ userId, text, voiceUrl, kind, mentor });
    this.logger.log(`Generated ${kind}: ${mentor} -> ${text}`);
  }
} 