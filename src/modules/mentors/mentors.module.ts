import { Module } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MentorsService],
  exports: [MentorsService],
})
export class MentorsModule {} 