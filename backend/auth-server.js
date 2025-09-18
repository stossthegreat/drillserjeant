const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');

// Initialize Firebase Admin (mock for now - will use real credentials later)
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

// Use mock Firebase for now
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

// Mock database
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
    features: {
      canUseDynamicTts: false,
      llmQuotaRemaining: 40,
      ttsQuotaRemaining: 2500,
    }
  }
};

const habits = [
  { id: 'habit-1', userId: 'demo-user-123', title: 'Morning Workout', streak: 5, schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'habit-2', userId: 'demo-user-123', title: 'Read 30 Minutes', streak: 12, schedule: { time: '20:00', days: ['daily'] }, createdAt: '2024-01-01T00:00:00Z' }
];

const antiHabits = [
  { id: 'anti-1', userId: 'demo-user-123', name: 'No phone after 22:45', cleanStreak: 3, targetMins: 15, dangerWin: { hours: [20, 21, 22, 23] } }
];

const alarms = [
  { id: 'alarm-1', userId: 'demo-user-123', label: 'Morning Workout', rrule: 'FREQ=DAILY;BYHOUR=7', enabled: true, tone: 'balanced' }
];

// ============ AUTH ENDPOINTS ============
fastify.post('/v1/auth/verifyToken', {
  schema: {
    tags: ['Auth'],
    summary: 'Verify Firebase ID token',
    body: { type: 'object', properties: { idToken: { type: 'string' } }, required: ['idToken'] },
    response: { 200: { type: 'object', properties: { uid: { type: 'string' }, email: { type: 'string' } } } }
  }
}, async (request, reply) => {
  try {
    const { idToken } = request.body;
    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    
    // Create or update user in our database
    if (!users[decodedToken.uid]) {
      users[decodedToken.uid] = {
        id: decodedToken.uid,
        email: decodedToken.email,
        tone: 'balanced',
        intensity: 2,
        consentRoast: false,
        plan: 'FREE',
        tz: 'America/New_York',
        createdAt: new Date().toISOString(),
        features: { canUseDynamicTts: false, llmQuotaRemaining: 40, ttsQuotaRemaining: 2500 }
      };
    }
    
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

// ============ USERS ENDPOINTS ============
fastify.get('/v1/users/me', {
  schema: {
    tags: ['Users'],
    summary: 'Get current user profile',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const user = users[request.user.id];
  if (!user) {
    reply.code(404).send({ error: 'User not found' });
    return;
  }
  return user;
});

fastify.patch('/v1/users/me', {
  schema: {
    tags: ['Users'],
    summary: 'Update user profile',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        tone: { type: 'string', enum: ['strict', 'balanced', 'light'] },
        intensity: { type: 'integer', minimum: 1, maximum: 3 },
        consentRoast: { type: 'boolean' },
        safeWord: { type: 'string' },
        tz: { type: 'string' }
      }
    },
    response: { 200: { type: 'object' } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userId = request.user.id;
  const user = users[userId];
  
  if (!user) {
    reply.code(404).send({ error: 'User not found' });
    return;
  }
  
  // Update user with provided fields
  Object.assign(user, request.body, { updatedAt: new Date().toISOString() });
  
  console.log(`✅ Updated user ${userId}:`, request.body);
  return user;
});

// ============ POLICIES ENDPOINTS ============
fastify.get('/v1/policies/current', {
  schema: {
    tags: ['Legal'],
    summary: 'Get current privacy policy and terms',
    response: { 200: { type: 'object' } }
  }
}, async (request, reply) => {
  return {
    privacyPolicy: {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      url: 'https://drillsergeant.com/privacy'
    },
    termsOfService: {
      version: '1.0.0',
      lastUpdated: '2024-01-01T00:00:00Z',
      url: 'https://drillsergeant.com/terms'
    }
  };
});

// ============ DSAR ENDPOINTS ============
fastify.post('/v1/account/export', {
  schema: {
    tags: ['DSAR'],
    summary: 'Export user data (GDPR compliance)',
    security: [{ bearerAuth: [] }],
    response: { 200: { type: 'object', properties: { downloadUrl: { type: 'string' }, expiresAt: { type: 'string' } } } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userId = request.user.id;
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  const userAlarms = alarms.filter(a => a.userId === userId);
  
  // In production, this would create a ZIP file and upload to S3
  const exportData = {
    profile: user,
    habits: userHabits,
    antiHabits: userAntiHabits,
    alarms: userAlarms,
    exportedAt: new Date().toISOString()
  };
  
  console.log(`📦 Data export requested for user ${userId}`);
  
  // Mock download URL - in production this would be a signed S3 URL
  return {
    downloadUrl: 'https://example.com/exports/user-data.zip',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    size: JSON.stringify(exportData).length
  };
});

fastify.post('/v1/account/delete', {
  schema: {
    tags: ['DSAR'],
    summary: 'Delete user account and all data',
    security: [{ bearerAuth: [] }],
    body: { type: 'object', properties: { confirmation: { type: 'string' } }, required: ['confirmation'] },
    response: { 200: { type: 'object', properties: { deleted: { type: 'boolean' }, scheduledAt: { type: 'string' } } } }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userId = request.user.id;
  const { confirmation } = request.body;
  
  if (confirmation !== 'DELETE_MY_ACCOUNT') {
    reply.code(400).send({ error: 'Invalid confirmation. Must be "DELETE_MY_ACCOUNT"' });
    return;
  }
  
  // In production, this would schedule a background job to delete all user data
  console.log(`🗑️  Account deletion scheduled for user ${userId}`);
  
  return {
    deleted: true,
    scheduledAt: new Date().toISOString(),
    message: 'Account deletion has been scheduled. All data will be permanently removed within 30 days.'
  };
});

// ============ EXISTING ENDPOINTS (with auth) ============
fastify.get('/v1/habits', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  return habits.filter(h => h.userId === request.user.id);
});

fastify.post('/v1/habits', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const habit = { id: `habit-${Date.now()}`, userId: request.user.id, ...request.body, streak: 0, createdAt: new Date().toISOString() };
  habits.push(habit);
  reply.code(201);
  return habit;
});

fastify.post('/v1/habits/:id/tick', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const habitId = request.params.id;
  const habit = habits.find(h => h.id === habitId && h.userId === request.user.id);
  
  if (habit) {
    habit.streak += 1;
    habit.lastTick = new Date().toISOString();
    console.log(`✅ Habit "${habit.title}" ticked! New streak: ${habit.streak}`);
  }
  
  return { ok: true, timestamp: new Date().toISOString() };
});

fastify.get('/v1/antihabits', {
  schema: { tags: ['Anti-Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  return antiHabits.filter(a => a.userId === request.user.id);
});

fastify.post('/v1/chat', {
  schema: { tags: ['Chat'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const { message, mode = 'balanced' } = request.body;
  const user = users[request.user.id];
  
  console.log(`💬 Chat from ${user.email}: "${message}" (${mode})`);
  
  const responses = {
    strict: "Quit whining. 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. Move.",
    balanced: "Reset: one small rep, then a clean 25. You got this.",
    light: "Notice the resistance. One mindful step, then begin a 25 minute sit."
  };

  return {
    reply: responses[mode] || responses.balanced,
    updates: [],
    suggested_actions: [{ type: 'start_timer', time: '25:00', message: 'Start focus session' }],
    confidence: 0.8,
    source: 'cds_fallback'
  };
});

fastify.get('/v1/brief/today', {
  schema: { tags: ['Brief'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const userHabits = habits.filter(h => h.userId === request.user.id);
  const missions = userHabits.slice(0, 3).map(h => ({
    id: h.id,
    title: h.title,
    streak: h.streak,
    due: 'today',
    progress: Math.random() > 0.5 ? 'pending' : 'completed'
  }));

  return {
    missions,
    riskBanners: [{ type: 'streak_save', habitId: 'habit-1', message: 'Morning workout streak at risk!' }],
    weeklyTarget: { current: 4.2, goal: 6.0 },
    achievements: [
      { id: 'first_week', title: 'First Week', unlocked: true },
      { id: 'first_month', title: 'First Month Younger', unlocked: true },
      { id: 'century_club', title: 'Century Club', unlocked: false }
    ],
    streaksSummary: { overall: 23, categories: [{ id: 'overall', name: 'Overall', days: 23 }] }
  };
});

// All other endpoints remain the same...
fastify.get('/v1/voice/preset/:id', { schema: { tags: ['Voice'] } }, async (request, reply) => {
  const presets = {
    'praise_30_day': 'https://example.com/audio/praise_30_day.mp3',
    'alarm_wake': 'https://example.com/audio/alarm_wake.mp3',
    'streak_save': 'https://example.com/audio/streak_save.mp3'
  };
  const url = presets[request.params.id];
  if (!url) {
    reply.code(404);
    return { error: 'Preset not found' };
  }
  return { url, expiresAt: new Date(Date.now() + 3600000).toISOString() };
});

fastify.get('/v1/alarms', {
  schema: { tags: ['Alarms'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  return alarms.filter(a => a.userId === request.user.id);
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    console.log('🚀 DrillSergeant API with Auth running on http://localhost:8080');
    console.log('📚 API docs available at http://localhost:8080/docs');
    console.log('🔐 Auth endpoints: /v1/auth/verifyToken, /v1/users/me');
    console.log('📄 OpenAPI spec updated at ./openapi.json');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
