import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { HabitsModule } from '../habits/habits.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [HabitsModule, StreaksModule],
  controllers: [BriefController],
  providers: [BriefService],
})
export class BriefModule {} 