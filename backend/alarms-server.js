const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const cron = require('node-cron');

// Simple UUID generator
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Redis connection for BullMQ
const redis = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  lazyConnect: true
});

// Job queues
const alarmQueue = new Queue('alarms', { connection: redis });
const rulesQueue = new Queue('rules', { connection: redis });

// Mock Firebase
const mockFirebase = {
  auth: () => ({
    verifyIdToken: async (token) => {
      if (token === 'valid-token') {
        return { uid: 'demo-user-123', email: 'demo@drillsergeant.com' };
      }
      throw new Error('Invalid token');
    }
  })
};

const firebase = process.env.FIREBASE_PRIVATE_KEY ? admin : mockFirebase;

// Register plugins
fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: { title: 'DrillSergeant API v3 (Alarms)', version: '1.0.0' },
    servers: [{ url: 'http://localhost:8080' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  }
});
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'full', deepLinking: false }
});

// In-memory stores
const users = {
  'demo-user-123': {
    id: 'demo-user-123',
    email: 'demo@drillsergeant.com',
    tone: 'balanced',
    intensity: 2,
    consentRoast: false,
    safeWord: null,
    plan: 'FREE',
    tz: 'America/New_York',
    createdAt: '2024-01-01T00:00:00Z',
    features: { canUseDynamicTts: false, llmQuotaRemaining: 40, ttsQuotaRemaining: 2500 }
  }
};

const habits = [
  { 
    id: 'habit-1', 
    userId: 'demo-user-123', 
    title: 'Morning Workout', 
    streak: 6, 
    schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }, 
    lastTick: new Date().toISOString(),
    context: { difficulty: 2, category: 'fitness', lifeDays: 0.5 },
    createdAt: '2024-01-01T00:00:00Z' 
  },
  { 
    id: 'habit-2', 
    userId: 'demo-user-123', 
    title: 'Read 30 Minutes', 
    streak: 12, 
    schedule: { time: '20:00', days: ['daily'] }, 
    lastTick: null,
    context: { difficulty: 1, category: 'learning', lifeDays: 0.3 },
    createdAt: '2024-01-01T00:00:00Z' 
  }
];

const antiHabits = [
  { 
    id: 'anti-1', 
    userId: 'demo-user-123', 
    name: 'No phone after 22:45', 
    cleanStreak: 0, 
    targetMins: 15, 
    lastSlip: new Date().toISOString(),
    dangerWin: { hours: [20, 21, 22, 23] },
    interceptionEnabled: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const alarms = [
  {
    id: 'alarm-1',
    userId: 'demo-user-123',
    label: 'Morning Workout',
    rrule: 'FREQ=DAILY;BYHOUR=7;BYMINUTE=0',
    tone: 'balanced',
    enabled: true,
    nextRun: null,
    createdAt: '2024-01-01T00:00:00Z',
    metadata: { type: 'habit_reminder', habitId: 'habit-1' }
  },
  {
    id: 'alarm-2',
    userId: 'demo-user-123',
    label: 'Test Alarm (2 minutes)',
    rrule: 'FREQ=ONCE',
    tone: 'strict',
    enabled: true,
    nextRun: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    metadata: { type: 'test_alarm' }
  }
];

const events = [];
const idempotencyCache = new Map();

// Auth middleware
async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await firebase.auth().verifyIdToken(token);
    request.user = { id: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    reply.code(401).send({ error: 'Invalid authentication token' });
  }
}

// Event logging utility
function logEvent(userId, type, payload, metadata = {}) {
  const event = {
    id: generateId(),
    userId,
    ts: new Date().toISOString(),
    type,
    payload,
    metadata
  };
  events.push(event);
  console.log(`📝 Event logged: ${type} for user ${userId}`);
  return event;
}

// RRULE parser (simplified)
function parseRRule(rrule, baseTime = new Date()) {
  if (rrule === 'FREQ=ONCE') {
    return null; // One-time alarm, nextRun set manually
  }
  
  if (rrule.includes('FREQ=DAILY')) {
    const hourMatch = rrule.match(/BYHOUR=(\d+)/);
    const minuteMatch = rrule.match(/BYMINUTE=(\d+)/);
    
    const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minute = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    const next = new Date(baseTime);
    next.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (next <= baseTime) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
  
  // Default: schedule for 1 hour from now
  return new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString();
}

// Schedule alarm job
async function scheduleAlarm(alarm) {
  const delay = new Date(alarm.nextRun) - new Date();
  
  if (delay > 0) {
    await alarmQueue.add(
      'fire-alarm',
      {
        alarmId: alarm.id,
        userId: alarm.userId,
        label: alarm.label,
        tone: alarm.tone,
        metadata: alarm.metadata
      },
      {
        delay,
        jobId: `alarm-${alarm.id}-${Date.now()}`,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );
    
    console.log(`⏰ Alarm "${alarm.label}" scheduled for ${alarm.nextRun} (${Math.round(delay/1000)}s from now)`);
  }
}

// ============ ALARM WORKERS ============
const alarmWorker = new Worker('alarms', async (job) => {
  const { alarmId, userId, label, tone, metadata } = job.data;
  
  console.log(`🔔 ALARM FIRING: ${label} for user ${userId}`);
  
  // Log alarm fire event
  logEvent(userId, 'alarm_fire', {
    alarmId,
    label,
    tone,
    metadata,
    firedAt: new Date().toISOString()
  });
  
  // In production, this would:
  // 1. Send FCM push notification
  // 2. Play preset audio based on tone
  // 3. Show alarm takeover screen
  
  // Mock push notification
  console.log(`📱 Push notification sent: "${label}"`);
  
  // Schedule escalation if not dismissed within 2 minutes
  await alarmQueue.add(
    'escalate-alarm',
    { alarmId, userId, label, originalFiredAt: new Date().toISOString() },
    { delay: 2 * 60 * 1000, jobId: `escalate-${alarmId}-${Date.now()}` }
  );
  
  // Reschedule recurring alarms
  const alarm = alarms.find(a => a.id === alarmId);
  if (alarm && alarm.enabled && !alarm.rrule.includes('FREQ=ONCE')) {
    const nextRun = parseRRule(alarm.rrule, new Date());
    if (nextRun) {
      alarm.nextRun = nextRun;
      await scheduleAlarm(alarm);
    }
  }
  
}, { connection: redis });

// Escalation worker
alarmWorker.add('escalate-alarm', async (job) => {
  const { alarmId, userId, label, originalFiredAt } = job.data;
  
  // Check if alarm was dismissed (would check events in real implementation)
  const dismissEvents = events.filter(e => 
    e.type === 'alarm_dismiss' && 
    e.payload.alarmId === alarmId &&
    new Date(e.ts) > new Date(originalFiredAt)
  );
  
  if (dismissEvents.length === 0) {
    console.log(`🚨 ESCALATING ALARM: ${label} (not dismissed)`);
    
    logEvent(userId, 'alarm_escalation', {
      alarmId,
      label,
      originalFiredAt,
      escalatedAt: new Date().toISOString()
    });
    
    // Send louder/more aggressive notification
    console.log(`📢 ESCALATED push notification: "GET UP! ${label}"`);
  } else {
    console.log(`✅ Alarm ${label} was dismissed, no escalation needed`);
  }
});

// Rules engine worker
const rulesWorker = new Worker('rules', async (job) => {
  const { userId, triggerEvent } = job.data;
  
  console.log(`🔄 Rules engine processing for user ${userId}, trigger: ${triggerEvent.type}`);
  
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  
  // Rule 1: Streak at risk detection
  const now = new Date();
  const today = now.toDateString();
  
  for (const habit of userHabits) {
    const lastTick = habit.lastTick ? new Date(habit.lastTick) : null;
    const tickedToday = lastTick && lastTick.toDateString() === today;
    
    if (!tickedToday && habit.streak > 0) {
      // Check if it's evening and habit not done
      const hour = now.getHours();
      if (hour >= 18) { // After 6 PM
        console.log(`⚠️  RULE: Streak at risk for "${habit.title}"`);
        
        logEvent(userId, 'streak_at_risk', {
          habitId: habit.id,
          title: habit.title,
          streak: habit.streak,
          detectedAt: now.toISOString()
        });
        
        // Could trigger push notification here
        console.log(`📱 Streak save notification: "${habit.title} streak at risk!"`);
      }
    }
  }
  
  // Rule 2: Anti-habit danger window
  if (triggerEvent.type === 'antihabit_slip') {
    const antiHabit = userAntiHabits.find(a => a.id === triggerEvent.payload.antiHabitId);
    if (antiHabit && antiHabit.dangerWin?.hours) {
      const currentHour = now.getHours();
      if (antiHabit.dangerWin.hours.includes(currentHour)) {
        console.log(`🚫 RULE: Slip during danger window for "${antiHabit.name}"`);
        
        logEvent(userId, 'danger_window_slip', {
          antiHabitId: antiHabit.id,
          name: antiHabit.name,
          hour: currentHour,
          detectedAt: now.toISOString()
        });
        
        console.log(`📱 Danger slip notification: "Stand down! ${antiHabit.name} in danger window"`);
      }
    }
  }
  
}, { connection: redis });

// ============ ALARM ENDPOINTS ============
fastify.get('/v1/alarms', {
  schema: {
    tags: ['Alarms'],
    summary: 'List user alarms',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'array' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userAlarms = alarms.filter(a => a.userId === request.user.id);
  return userAlarms;
});

fastify.post('/v1/alarms', {
  schema: {
    tags: ['Alarms'],
    summary: 'Create new alarm',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        rrule: { type: 'string' },
        tone: { type: 'string', enum: ['strict', 'balanced', 'light'] },
        metadata: { type: 'object' }
      },
      required: ['label', 'rrule']
    },
    response: { 201: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { label, rrule, tone = 'balanced', metadata = {} } = request.body;
  
  const alarm = {
    id: `alarm-${Date.now()}`,
    userId: request.user.id,
    label,
    rrule,
    tone,
    enabled: true,
    nextRun: parseRRule(rrule),
    createdAt: new Date().toISOString(),
    metadata
  };
  
  alarms.push(alarm);
  
  // Schedule the alarm
  if (alarm.nextRun) {
    await scheduleAlarm(alarm);
  }
  
  logEvent(request.user.id, 'alarm_created', { alarmId: alarm.id, label, rrule });
  
  reply.code(201);
  return alarm;
});

fastify.patch('/v1/alarms/:id', {
  schema: {
    tags: ['Alarms'],
    summary: 'Update alarm',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const alarmId = request.params.id;
  const alarm = alarms.find(a => a.id === alarmId && a.userId === request.user.id);
  
  if (!alarm) {
    reply.code(404).send({ error: 'Alarm not found' });
    return;
  }
  
  const oldEnabled = alarm.enabled;
  Object.assign(alarm, request.body, { updatedAt: new Date().toISOString() });
  
  // Reschedule if enabled or rrule changed
  if (alarm.enabled && (!oldEnabled || request.body.rrule)) {
    alarm.nextRun = parseRRule(alarm.rrule);
    if (alarm.nextRun) {
      await scheduleAlarm(alarm);
    }
  }
  
  logEvent(request.user.id, 'alarm_updated', { alarmId, changes: request.body });
  
  return alarm;
});

fastify.delete('/v1/alarms/:id', {
  schema: {
    tags: ['Alarms'],
    summary: 'Delete alarm',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const alarmId = request.params.id;
  const index = alarms.findIndex(a => a.id === alarmId && a.userId === request.user.id);
  
  if (index === -1) {
    reply.code(404).send({ error: 'Alarm not found' });
    return;
  }
  
  alarms.splice(index, 1);
  
  // Cancel any pending jobs (would need job tracking in production)
  logEvent(request.user.id, 'alarm_deleted', { alarmId });
  
  return { deleted: true };
});

// ============ ALARM ACTIONS ============
fastify.post('/v1/alarms/:id/dismiss', {
  schema: {
    tags: ['Alarms'],
    summary: 'Dismiss fired alarm',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const alarmId = request.params.id;
  
  logEvent(request.user.id, 'alarm_dismiss', {
    alarmId,
    dismissedAt: new Date().toISOString()
  });
  
  console.log(`✅ Alarm ${alarmId} dismissed by user ${request.user.id}`);
  
  return { ok: true, dismissed: true };
});

fastify.post('/v1/jobs/schedule-alarm', {
  schema: {
    tags: ['Jobs'],
    summary: 'Manually schedule alarm (dev/test)',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        alarmId: { type: 'string' },
        delaySeconds: { type: 'number', default: 10 }
      },
      required: ['alarmId']
    },
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { alarmId, delaySeconds = 10 } = request.body;
  const alarm = alarms.find(a => a.id === alarmId && a.userId === request.user.id);
  
  if (!alarm) {
    reply.code(404).send({ error: 'Alarm not found' });
    return;
  }
  
  // Schedule alarm to fire in specified seconds
  alarm.nextRun = new Date(Date.now() + delaySeconds * 1000).toISOString();
  await scheduleAlarm(alarm);
  
  return {
    ok: true,
    message: `Alarm "${alarm.label}" scheduled to fire in ${delaySeconds} seconds`,
    nextRun: alarm.nextRun
  };
});

// ============ EXISTING ENDPOINTS (Habits, etc.) ============
// ... (keeping all the existing habit/auth endpoints from previous version)

fastify.get('/v1/habits', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const userHabits = habits.filter(h => h.userId === request.user.id);
  const habitsWithStatus = userHabits.map(habit => ({
    ...habit,
    status: habit.lastTick && new Date(habit.lastTick).toDateString() === new Date().toDateString() 
      ? 'completed_today' : 'pending'
  }));
  return habitsWithStatus;
});

fastify.post('/v1/habits/:id/tick', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const habitId = request.params.id;
  const habit = habits.find(h => h.id === habitId && h.userId === request.user.id);
  
  if (!habit) {
    reply.code(404).send({ error: 'Habit not found' });
    return;
  }
  
  const today = new Date().toDateString();
  const alreadyTickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
  
  if (!alreadyTickedToday) {
    const previousStreak = habit.streak;
    habit.streak += 1;
    habit.lastTick = new Date().toISOString();
    
    const event = logEvent(request.user.id, 'habit_tick', {
      habitId,
      title: habit.title,
      streak: habit.streak,
      previousStreak
    });
    
    // Trigger rules engine
    await rulesQueue.add('evaluate-rules', {
      userId: request.user.id,
      triggerEvent: event
    });
    
    console.log(`✅ Habit "${habit.title}" ticked! Streak: ${previousStreak} → ${habit.streak}`);
  }
  
  return {
    ok: true,
    streak: habit.streak,
    timestamp: habit.lastTick,
    idempotent: alreadyTickedToday
  };
});

// Other endpoints...
fastify.post('/v1/auth/verifyToken', { schema: { tags: ['Auth'] } }, async (request, reply) => {
  try {
    const { idToken } = request.body;
    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

fastify.get('/v1/users/me', {
  schema: { tags: ['Users'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  return users[request.user.id] || {};
});

fastify.post('/v1/chat', {
  schema: { tags: ['Chat'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const { message, mode = 'balanced' } = request.body;
  
  const responses = {
    strict: "Quit whining. 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. Move.",
    balanced: "Reset: one small rep, then a clean 25. You got this.",
    light: "Notice the resistance. One mindful step, then begin a 25 minute sit."
  };

  return {
    reply: responses[mode] || responses.balanced,
    updates: [],
    suggested_actions: [{ type: 'start_timer', time: '25:00' }],
    confidence: 0.8,
    source: 'cds_fallback'
  };
});

// ============ SCHEDULER SETUP ============
// Schedule existing alarms on startup
async function initializeAlarms() {
  console.log('🔄 Initializing alarm scheduler...');
  
  for (const alarm of alarms) {
    if (alarm.enabled && alarm.nextRun) {
      const nextRun = new Date(alarm.nextRun);
      if (nextRun > new Date()) {
        await scheduleAlarm(alarm);
      } else if (!alarm.rrule.includes('FREQ=ONCE')) {
        // Reschedule recurring alarms that are in the past
        alarm.nextRun = parseRRule(alarm.rrule);
        if (alarm.nextRun) {
          await scheduleAlarm(alarm);
        }
      }
    }
  }
  
  console.log(`✅ Scheduled ${alarms.filter(a => a.enabled).length} alarms`);
}

// Hourly rules evaluation
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Hourly rules evaluation triggered');
  
  for (const userId of Object.keys(users)) {
    await rulesQueue.add('evaluate-rules', {
      userId,
      triggerEvent: { type: 'hourly_check', ts: new Date().toISOString() }
    });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    // Initialize alarms after server starts
    await initializeAlarms();
    
    console.log('🚀 DrillSergeant API v3 (Alarms + BullMQ) running on http://localhost:8080');
    console.log('📚 API docs: http://localhost:8080/docs');
    console.log('✅ Features: Alarm scheduling, BullMQ jobs, Rules engine, Escalation');
    console.log('⏰ Cron jobs: Hourly rules evaluation active');
    
    // Show upcoming alarms
    const upcomingAlarms = alarms.filter(a => a.enabled && a.nextRun && new Date(a.nextRun) > new Date());
    if (upcomingAlarms.length > 0) {
      console.log('📅 Upcoming alarms:');
      upcomingAlarms.forEach(a => {
        const timeUntil = Math.round((new Date(a.nextRun) - new Date()) / 1000);
        console.log(`   - "${a.label}" in ${timeUntil}s (${new Date(a.nextRun).toLocaleTimeString()})`);
      });
    }
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
