import { Module, forwardRef } from '@nestjs/common';
import { NudgesController } from './nudges.controller';
import { NudgesService } from './nudges.service';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [forwardRef(() => VoiceModule)],
  controllers: [NudgesController],
  providers: [NudgesService],
  exports: [NudgesService],
})
export class NudgesModule {} 