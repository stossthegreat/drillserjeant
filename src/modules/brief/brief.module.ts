import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { HabitsModule } from '../habits/habits.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [HabitsModule, TasksModule],
  controllers: [BriefController],
  providers: [BriefService],
  exports: [BriefService],
})
export class BriefModule {} 