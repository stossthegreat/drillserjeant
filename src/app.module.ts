import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { HabitsModule } from './modules/habits/habits.module';
import { ChatModule } from './modules/chat/chat.module';
import { VoiceModule } from './modules/voice/voice.module';
import { AlarmsModule } from './modules/alarms/alarms.module';
import { AuthModule } from './modules/auth/auth.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { BriefModule } from './modules/brief/brief.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    HabitsModule,
    ChatModule,
    VoiceModule,
    AlarmsModule,
    StreaksModule,
    BriefModule,
    BillingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
