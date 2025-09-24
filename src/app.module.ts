import { Module } from '@nestjs/common';
import { VoiceModule } from './modules/voice/voice.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NudgesModule } from './modules/nudges/nudges.module';
import { HabitsModule } from './modules/habits/habits.module';
import { BriefModule } from './modules/brief/brief.module';

@Module({
  imports: [
    HabitsModule,
    TasksModule,
    BriefModule,
    NudgesModule,
    VoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 