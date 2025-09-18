const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');
const cron = require('node-cron');

// Simple UUID generator
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    info: { title: 'DrillSergeant API v3 (Simple Alarms)', version: '1.0.0' },
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
    label: 'Morning Workout Reminder',
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
    label: 'Test Alarm (30 seconds)',
    rrule: 'FREQ=ONCE',
    tone: 'strict',
    enabled: true,
    nextRun: new Date(Date.now() + 30 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    metadata: { type: 'test_alarm' }
  }
];

const events = [];
const pendingAlarms = new Map(); // Simple alarm scheduler

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

// Event logging
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

// Simple RRULE parser
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
    
    if (next <= baseTime) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
  
  return new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString();
}

// Simple alarm scheduler
function scheduleAlarm(alarm) {
  if (!alarm.nextRun || !alarm.enabled) return;
  
  const delay = new Date(alarm.nextRun) - new Date();
  
  if (delay > 0) {
    const timeoutId = setTimeout(() => {
      fireAlarm(alarm);
    }, delay);
    
    pendingAlarms.set(alarm.id, timeoutId);
    
    console.log(`⏰ Alarm "${alarm.label}" scheduled for ${alarm.nextRun} (${Math.round(delay/1000)}s from now)`);
  }
}

// Fire alarm
function fireAlarm(alarm) {
  console.log(`🔔 ALARM FIRING: ${alarm.label} for user ${alarm.userId}`);
  
  // Log alarm fire event
  logEvent(alarm.userId, 'alarm_fire', {
    alarmId: alarm.id,
    label: alarm.label,
    tone: alarm.tone,
    metadata: alarm.metadata,
    firedAt: new Date().toISOString()
  });
  
  // Mock push notification
  console.log(`📱 Push notification: "${alarm.label}" - Time to take action!`);
  
  // Schedule escalation
  setTimeout(() => {
    escalateAlarm(alarm);
  }, 2 * 60 * 1000); // 2 minutes
  
  // Reschedule recurring alarms
  if (alarm.enabled && !alarm.rrule.includes('FREQ=ONCE')) {
    const nextRun = parseRRule(alarm.rrule, new Date());
    if (nextRun) {
      alarm.nextRun = nextRun;
      scheduleAlarm(alarm);
    }
  }
}

// Escalate alarm if not dismissed
function escalateAlarm(alarm) {
  const dismissEvents = events.filter(e => 
    e.type === 'alarm_dismiss' && 
    e.payload.alarmId === alarm.id &&
    new Date(e.ts) > new Date(Date.now() - 3 * 60 * 1000) // Last 3 minutes
  );
  
  if (dismissEvents.length === 0) {
    console.log(`🚨 ESCALATING ALARM: ${alarm.label} (not dismissed)`);
    
    logEvent(alarm.userId, 'alarm_escalation', {
      alarmId: alarm.id,
      label: alarm.label,
      escalatedAt: new Date().toISOString()
    });
    
    console.log(`📢 ESCALATED notification: "URGENT! ${alarm.label}"`);
  } else {
    console.log(`✅ Alarm ${alarm.label} was dismissed, no escalation needed`);
  }
}

// Rules engine (simplified)
function evaluateRules(userId, triggerEvent) {
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  
  console.log(`🔄 Rules engine processing for user ${userId}, trigger: ${triggerEvent.type}`);
  
  // Rule 1: Streak at risk detection
  const now = new Date();
  const today = now.toDateString();
  
  for (const habit of userHabits) {
    const lastTick = habit.lastTick ? new Date(habit.lastTick) : null;
    const tickedToday = lastTick && lastTick.toDateString() === today;
    
    if (!tickedToday && habit.streak > 0) {
      const hour = now.getHours();
      if (hour >= 18) { // After 6 PM
        console.log(`⚠️  RULE: Streak at risk for "${habit.title}"`);
        
        logEvent(userId, 'streak_at_risk', {
          habitId: habit.id,
          title: habit.title,
          streak: habit.streak,
          detectedAt: now.toISOString()
        });
        
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
}

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
  return userAlarms.map(alarm => ({
    ...alarm,
    status: pendingAlarms.has(alarm.id) ? 'scheduled' : 'inactive',
    timeUntilNext: alarm.nextRun ? Math.max(0, Math.round((new Date(alarm.nextRun) - new Date()) / 1000)) : null
  }));
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
        delaySeconds: { type: 'number' }
      },
      required: ['label']
    },
    response: { 201: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { label, rrule = 'FREQ=ONCE', tone = 'balanced', delaySeconds = 60 } = request.body;
  
  const alarm = {
    id: `alarm-${Date.now()}`,
    userId: request.user.id,
    label,
    rrule,
    tone,
    enabled: true,
    nextRun: rrule === 'FREQ=ONCE' 
      ? new Date(Date.now() + delaySeconds * 1000).toISOString()
      : parseRRule(rrule),
    createdAt: new Date().toISOString(),
    metadata: { type: 'user_created' }
  };
  
  alarms.push(alarm);
  
  // Schedule the alarm
  scheduleAlarm(alarm);
  
  logEvent(request.user.id, 'alarm_created', { alarmId: alarm.id, label, rrule });
  
  reply.code(201);
  return {
    ...alarm,
    message: `Alarm "${label}" created and scheduled`,
    timeUntilNext: Math.round((new Date(alarm.nextRun) - new Date()) / 1000)
  };
});

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
  
  // Cancel pending timeout
  if (pendingAlarms.has(alarmId)) {
    clearTimeout(pendingAlarms.get(alarmId));
    pendingAlarms.delete(alarmId);
  }
  
  alarms.splice(index, 1);
  logEvent(request.user.id, 'alarm_deleted', { alarmId });
  
  return { deleted: true };
});

// ============ EXISTING ENDPOINTS ============
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
    evaluateRules(request.user.id, event);
    
    console.log(`✅ Habit "${habit.title}" ticked! Streak: ${previousStreak} → ${habit.streak}`);
  }
  
  return {
    ok: true,
    streak: habit.streak,
    timestamp: habit.lastTick,
    idempotent: alreadyTickedToday
  };
});

// Other endpoints
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

// ============ INITIALIZATION ============
function initializeAlarms() {
  console.log('🔄 Initializing alarm scheduler...');
  
  for (const alarm of alarms) {
    if (alarm.enabled && alarm.nextRun) {
      const nextRun = new Date(alarm.nextRun);
      if (nextRun > new Date()) {
        scheduleAlarm(alarm);
      } else if (!alarm.rrule.includes('FREQ=ONCE')) {
        alarm.nextRun = parseRRule(alarm.rrule);
        if (alarm.nextRun) {
          scheduleAlarm(alarm);
        }
      }
    }
  }
  
  console.log(`✅ Scheduled ${Array.from(pendingAlarms.keys()).length} alarms`);
}

// Hourly rules evaluation
cron.schedule('0 * * * *', () => {
  console.log('⏰ Hourly rules evaluation triggered');
  
  for (const userId of Object.keys(users)) {
    evaluateRules(userId, { type: 'hourly_check', ts: new Date().toISOString() });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    // Initialize alarms after server starts
    initializeAlarms();
    
    console.log('🚀 DrillSergeant API v3 (Simple Alarms) running on http://localhost:8080');
    console.log('📚 API docs: http://localhost:8080/docs');
    console.log('✅ Features: Alarm scheduling, Rules engine, Escalation, CRON jobs');
    
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
