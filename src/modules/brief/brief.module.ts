import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MentorsModule } from '../mentors/mentors.module';
import { QueuesModule } from '../queues/queues.module';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';

@Module({
  imports: [PrismaModule, MentorsModule, QueuesModule],
  controllers: [BriefController],
  providers: [BriefService],
})
export class BriefModule {} 