import { Module } from '@nestjs/common';
import { RedisModule } from '../infra/redis.module';
import { QueuesService } from './queues.service';

@Module({
  imports: [RedisModule],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {} 