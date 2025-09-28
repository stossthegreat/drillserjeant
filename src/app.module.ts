import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/infra/redis.module';
import { QueuesModule } from './modules/queues/queues.module';
import { MentorsModule } from './modules/mentors/mentors.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EventsModule } from './modules/events/events.module';
import { BriefModule } from './modules/brief/brief.module';
import { NudgesModule } from './modules/nudges/nudges.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    QueuesModule,
    MentorsModule,
    ScheduleModule,
    ReportsModule,
    EventsModule,
    BriefModule,
    NudgesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 