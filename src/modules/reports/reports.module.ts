import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { HabitsModule } from '../habits/habits.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [HabitsModule, TasksModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {} 