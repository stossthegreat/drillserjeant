import { Module } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [PrismaModule, VoiceModule],
  providers: [MentorsService],
  exports: [MentorsService],
})
export class MentorsModule {} 