import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { MentorsModule } from '../mentors/mentors.module';

@Module({
  imports: [NestScheduleModule.forRoot(), PrismaModule, QueuesModule, MentorsModule],
  providers: [ScheduleService],
})
export class ScheduleModule {} 