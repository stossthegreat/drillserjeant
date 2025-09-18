const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // Create demo user
  const user = await prisma.user.create({
    data: {
      id: 'demo-user-123',
      email: 'demo@drillsergeant.com',
      tone: 'balanced',
      intensity: 2,
      consentRoast: false,
      plan: 'FREE',
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create demo habit
  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      title: 'Run 20m @07:45',
      schedule: { time: '07:45', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      streak: 0,
    },
  });

  console.log('✅ Created demo habit:', habit.title);

  // Create demo anti-habit
  const antiHabit = await prisma.antiHabit.create({
    data: {
      userId: user.id,
      name: 'No phone after 22:45',
      targetMins: 15,
      cleanStreak: 0,
      dangerWin: { hours: [20, 21, 22, 23] },
    },
  });

  console.log('✅ Created demo anti-habit:', antiHabit.name);

  // Create demo alarm for 2 minutes from now
  const twoMinutesFromNow = new Date(Date.now() + 2 * 60 * 1000);
  const alarm = await prisma.alarm.create({
    data: {
      userId: user.id,
      label: 'Test Alarm',
      rrule: 'FREQ=ONCE',
      tone: 'balanced',
      enabled: true,
      nextRun: twoMinutesFromNow,
    },
  });

  console.log('✅ Created demo alarm for:', twoMinutesFromNow.toISOString());

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 