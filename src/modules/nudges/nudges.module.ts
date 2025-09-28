import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MentorsModule } from '../mentors/mentors.module';
import { NudgesController } from './nudges.controller';
import { NudgesService } from './nudges.service';

@Module({
  imports: [PrismaModule, MentorsModule],
  controllers: [NudgesController],
  providers: [NudgesService],
})
export class NudgesModule {} 