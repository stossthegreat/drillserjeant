import { PrismaClient } from '@prisma/client';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

// Notifications Worker
const notificationsWorker = new Worker('notifications', async (job: Job) => {
  const { userId, text, voiceUrl, kind, mentor } = job.data;
  
  console.log(`📱 Processing notification for user ${userId}: ${text}`);
  
  // Here you would integrate with push notification services
  // For now, just log and store in events
  await prisma.event.create({
    data: {
      userId,
      type: 'notification_sent',
      payload: { text, voiceUrl, kind, mentor }
    }
  });
  
  console.log(`✅ Notification sent to user ${userId}`);
}, { connection: redis });

// Reports Worker  
const reportsWorker = new Worker('reports', async (job: Job) => {
  const { userId, type, date } = job.data;
  
  console.log(`📊 Generating ${type} report for user ${userId} on ${date}`);
  
  // Generate weekly/monthly reports
  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: { ts: 'desc' },
    take: 1000
  });
  
  const habits = await prisma.habit.findMany({
    where: { userId }
  });
  
  const report = {
    userId,
    type,
    date,
    habitsCount: habits.length,
    eventsCount: events.length,
    completedHabits: events.filter(e => e.type === 'habit_success').length,
    generatedAt: new Date().toISOString()
  };
  
  // Store report
  await prisma.event.create({
    data: {
      userId,
      type: `report_${type}`,
      payload: report
    }
  });
  
  console.log(`✅ ${type} report generated for user ${userId}`);
}, { connection: redis });

console.log('🔄 Workers started for notifications and reports');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down workers...');
  await notificationsWorker.close();
  await reportsWorker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}); 