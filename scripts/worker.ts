import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

async function main() {
  const prisma = new PrismaClient();
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  new Worker(
    'notifications',
    async (job: Job) => {
      try {
        if (job.name === 'notify') {
          const { userId, text, voiceUrl, kind, mentor } = job.data || {};
          await prisma.event.create({
            data: {
              userId: userId || 'demo-user-123',
              type: `notify_${kind || 'generic'}`,
              payload: { text, voiceUrl, mentor },
            },
          });
        }
        return true;
      } catch (e) {
        console.error('notifications worker error', e);
        throw e;
      }
    },
    { connection }
  );

  new Worker(
    'reports',
    async (job: Job) => {
      try {
        if (job.name === 'weekly_report') {
          const { userId } = job.data || {};
          await prisma.event.create({ data: { userId: userId || 'demo-user-123', type: 'weekly_report_generated', payload: {} } });
        }
        return true;
      } catch (e) {
        console.error('reports worker error', e);
        throw e;
      }
    },
    { connection }
  );

  console.log('BullMQ workers up');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 