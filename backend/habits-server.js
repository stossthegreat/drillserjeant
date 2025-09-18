const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');

// Simple UUID generator
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock Firebase for now
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
    info: { title: 'DrillSergeant API', version: '1.0.0' },
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

// In-memory stores (will be replaced with real database)
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
    streak: 5, 
    schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }, 
    lastTick: null,
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
    cleanStreak: 3, 
    targetMins: 15, 
    lastSlip: null,
    dangerWin: { hours: [20, 21, 22, 23] },
    interceptionEnabled: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const events = []; // Event log for tracking all actions
const idempotencyCache = new Map(); // Simple in-memory cache (use Redis in production)

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

// Idempotency middleware
async function handleIdempotency(request, reply) {
  const idempotencyKey = request.headers['idempotency-key'];
  if (!idempotencyKey) return; // Not required for all endpoints
  
  const cacheKey = `${request.user.id}:${request.method}:${request.url}:${idempotencyKey}`;
  
  if (idempotencyCache.has(cacheKey)) {
    const cachedResponse = idempotencyCache.get(cacheKey);
    console.log(`🔄 Idempotent response for key: ${idempotencyKey}`);
    reply.send(cachedResponse);
    return;
  }
  
  // Store response after processing
  request.idempotencyKey = idempotencyKey;
  request.cacheKey = cacheKey;
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

// ============ HABITS ENDPOINTS ============
fastify.get('/v1/habits', {
  schema: {
    tags: ['Habits'],
    summary: 'List user habits with real-time streak calculation',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'array' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userHabits = habits.filter(h => h.userId === request.user.id);
  
  // Add real-time status
  const habitsWithStatus = userHabits.map(habit => ({
    ...habit,
    status: habit.lastTick && new Date(habit.lastTick).toDateString() === new Date().toDateString() 
      ? 'completed_today' : 'pending'
  }));
  
  return habitsWithStatus;
});

fastify.post('/v1/habits', {
  schema: {
    tags: ['Habits'],
    summary: 'Create new habit',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        schedule: { type: 'object' },
        context: { type: 'object' }
      },
      required: ['title']
    },
    response: { 201: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { title, schedule = {}, context = {} } = request.body;
  
  const habit = {
    id: `habit-${Date.now()}`,
    userId: request.user.id,
    title,
    schedule,
    context: { difficulty: 1, category: 'general', lifeDays: 0.2, ...context },
    streak: 0,
    lastTick: null,
    createdAt: new Date().toISOString()
  };
  
  habits.push(habit);
  
  // Log creation event
  logEvent(request.user.id, 'habit_created', { habitId: habit.id, title });
  
  reply.code(201);
  return habit;
});

fastify.post('/v1/habits/:id/tick', {
  schema: {
    tags: ['Habits'],
    summary: 'Mark habit as completed (idempotent)',
    security: [{ bearerAuth: [] }],
    headers: {
      type: 'object',
      properties: {
        'idempotency-key': { type: 'string' }
      }
    },
    response: { 200: { type: 'object' } }
  },
  preHandler: [authenticate, handleIdempotency]
}, async (request, reply) => {
  const habitId = request.params.id;
  const habit = habits.find(h => h.id === habitId && h.userId === request.user.id);
  
  if (!habit) {
    reply.code(404).send({ error: 'Habit not found' });
    return;
  }
  
  const today = new Date().toDateString();
  const alreadyTickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
  
  let response;
  
  if (alreadyTickedToday) {
    // Already ticked today - idempotent response
    response = {
      ok: true,
      message: 'Habit already completed today',
      streak: habit.streak,
      timestamp: habit.lastTick,
      idempotent: true
    };
  } else {
    // New tick - update habit
    const previousStreak = habit.streak;
    habit.streak += 1;
    habit.lastTick = new Date().toISOString();
    
    // Check for milestone achievements
    const milestones = [7, 30, 90, 100, 365];
    const achievedMilestone = milestones.find(m => 
      habit.streak >= m && previousStreak < m
    );
    
    // Log tick event
    const event = logEvent(request.user.id, 'habit_tick', {
      habitId,
      title: habit.title,
      streak: habit.streak,
      previousStreak,
      achievedMilestone
    });
    
    response = {
      ok: true,
      message: `Habit completed! Streak: ${habit.streak}`,
      streak: habit.streak,
      previousStreak,
      timestamp: habit.lastTick,
      achievedMilestone,
      eventId: event.id,
      idempotent: false
    };
    
    console.log(`✅ Habit "${habit.title}" ticked! Streak: ${previousStreak} → ${habit.streak}`);
    
    if (achievedMilestone) {
      console.log(`🎉 Milestone achieved: ${achievedMilestone} days!`);
    }
  }
  
  // Cache response for idempotency
  if (request.cacheKey) {
    idempotencyCache.set(request.cacheKey, response);
    // Set expiry (24 hours)
    setTimeout(() => idempotencyCache.delete(request.cacheKey), 24 * 60 * 60 * 1000);
  }
  
  return response;
});

// ============ ANTI-HABITS ENDPOINTS ============
fastify.get('/v1/antihabits', {
  schema: {
    tags: ['Anti-Habits'],
    summary: 'List user anti-habits',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'array' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userAntiHabits = antiHabits.filter(a => a.userId === request.user.id);
  
  // Add real-time status
  const antiHabitsWithStatus = userAntiHabits.map(antiHabit => ({
    ...antiHabit,
    status: antiHabit.lastSlip && new Date(antiHabit.lastSlip).toDateString() === new Date().toDateString()
      ? 'slipped_today' : 'clean',
    daysSinceLastSlip: antiHabit.lastSlip 
      ? Math.floor((new Date() - new Date(antiHabit.lastSlip)) / (24 * 60 * 60 * 1000))
      : null
  }));
  
  return antiHabitsWithStatus;
});

fastify.post('/v1/antihabits/:id/slip', {
  schema: {
    tags: ['Anti-Habits'],
    summary: 'Record anti-habit slip (idempotent)',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object' } }
  },
  preHandler: [authenticate, handleIdempotency]
}, async (request, reply) => {
  const antiHabitId = request.params.id;
  const antiHabit = antiHabits.find(a => a.id === antiHabitId && a.userId === request.user.id);
  
  if (!antiHabit) {
    reply.code(404).send({ error: 'Anti-habit not found' });
    return;
  }
  
  const today = new Date().toDateString();
  const alreadySlippedToday = antiHabit.lastSlip && new Date(antiHabit.lastSlip).toDateString() === today;
  
  let response;
  
  if (alreadySlippedToday) {
    response = {
      ok: true,
      message: 'Slip already recorded today',
      cleanStreak: antiHabit.cleanStreak,
      timestamp: antiHabit.lastSlip,
      idempotent: true
    };
  } else {
    const previousStreak = antiHabit.cleanStreak;
    antiHabit.cleanStreak = 0; // Reset clean streak
    antiHabit.lastSlip = new Date().toISOString();
    
    const event = logEvent(request.user.id, 'antihabit_slip', {
      antiHabitId,
      name: antiHabit.name,
      previousStreak,
      dangerWindow: antiHabit.dangerWin
    });
    
    response = {
      ok: true,
      message: 'Slip recorded. Clean streak reset.',
      cleanStreak: 0,
      previousStreak,
      timestamp: antiHabit.lastSlip,
      eventId: event.id,
      idempotent: false
    };
    
    console.log(`❌ Anti-habit "${antiHabit.name}" slip recorded. Streak reset: ${previousStreak} → 0`);
  }
  
  // Cache response for idempotency
  if (request.cacheKey) {
    idempotencyCache.set(request.cacheKey, response);
    setTimeout(() => idempotencyCache.delete(request.cacheKey), 24 * 60 * 60 * 1000);
  }
  
  return response;
});

// ============ OTHER ENDPOINTS ============
fastify.post('/v1/auth/verifyToken', {
  schema: { tags: ['Auth'] }
}, async (request, reply) => {
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

fastify.patch('/v1/users/me', {
  schema: { tags: ['Users'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const user = users[request.user.id];
  Object.assign(user, request.body, { updatedAt: new Date().toISOString() });
  return user;
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

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    console.log('🚀 DrillSergeant API v2 (Enhanced Habits) running on http://localhost:8080');
    console.log('📚 API docs: http://localhost:8080/docs');
    console.log('✅ Features: Idempotent tick/slip, Event logging, Real-time streaks');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
