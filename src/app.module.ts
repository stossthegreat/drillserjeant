import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/infra/redis.module';
import { QueuesModule } from './modules/queues/queues.module';

// Core Modules
import { HabitsModule } from './modules/habits/habits.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { BriefModule } from './modules/brief/brief.module';
import { EventsModule } from './modules/events/events.module';

// AI & Voice
import { MentorsModule } from './modules/mentors/mentors.module';
import { NudgesModule } from './modules/nudges/nudges.module';
import { VoiceModule } from './modules/voice/voice.module';

// Analytics
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    
    // Infrastructure
    PrismaModule,
    RedisModule,
    QueuesModule,
    
    // Core Features
    HabitsModule,
    TasksModule,
    BriefModule,
    EventsModule,
    
    // AI & Voice
    MentorsModule,
    NudgesModule,
    VoiceModule,
    
    // Analytics
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 