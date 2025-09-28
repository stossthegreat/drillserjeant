import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlarmsController } from './alarms.controller';
import { AlarmsService } from './alarms.service';

@Module({
  imports: [PrismaModule],
  controllers: [AlarmsController],
  providers: [AlarmsService],
})
export class AlarmsModule {} 