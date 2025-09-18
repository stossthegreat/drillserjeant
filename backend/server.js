const fastify = require('fastify')({ logger: true });

// Register plugins
fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/swagger'), {
  openapi: {
    openapi: '3.0.0',
    info: { title: 'DrillSergeant API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:8080' }]
  }
});
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'full', deepLinking: false }
});

// Mock data
const users = { 'demo-user-123': { id: 'demo-user-123', email: 'demo@drillsergeant.com', tone: 'balanced', intensity: 2, plan: 'FREE' }};
const habits = [
  { id: 'habit-1', userId: 'demo-user-123', title: 'Morning Workout', streak: 5 },
  { id: 'habit-2', userId: 'demo-user-123', title: 'Read 30 Minutes', streak: 12 }
];

// ============ USERS ENDPOINTS ============
fastify.get('/v1/users/me', {
  schema: {
    tags: ['Users'],
    summary: 'Get current user profile',
    response: { 200: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, tone: { type: 'string' }, plan: { type: 'string' } }}}
  }
}, async (request, reply) => {
  return users['demo-user-123'];
});

fastify.patch('/v1/users/me', {
  schema: {
    tags: ['Users'],
    summary: 'Update user profile',
    body: { type: 'object', properties: { tone: { type: 'string' }, intensity: { type: 'number' } }},
    response: { 200: { type: 'object' }}
  }
}, async (request, reply) => {
  const userId = 'demo-user-123';
  users[userId] = { ...users[userId], ...request.body, updatedAt: new Date().toISOString() };
  return users[userId];
});

// ============ HABITS ENDPOINTS ============
fastify.get('/v1/habits', {
  schema: {
    tags: ['Habits'],
    summary: 'List user habits',
    response: { 200: { type: 'array', items: { type: 'object' }}}
  }
}, async (request, reply) => {
  return habits.filter(h => h.userId === 'demo-user-123');
});

fastify.post('/v1/habits', {
  schema: {
    tags: ['Habits'],
    summary: 'Create new habit',
    body: { type: 'object', properties: { title: { type: 'string' }, schedule: { type: 'object' }}},
    response: { 201: { type: 'object' }}
  }
}, async (request, reply) => {
  const habit = { id: `habit-${Date.now()}`, userId: 'demo-user-123', ...request.body, streak: 0 };
  habits.push(habit);
  reply.code(201);
  return habit;
});

fastify.post('/v1/habits/:id/tick', {
  schema: {
    tags: ['Habits'],
    summary: 'Mark habit as completed (idempotent)',
    params: { type: 'object', properties: { id: { type: 'string' }}},
    response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, timestamp: { type: 'string' }}}}
  }
}, async (request, reply) => {
  const habitId = request.params.id;
  const habit = habits.find(h => h.id === habitId && h.userId === 'demo-user-123');
  
  if (habit) {
    habit.streak += 1;
    console.log(`✅ Habit "${habit.title}" ticked! New streak: ${habit.streak}`);
  }
  
  return { ok: true, timestamp: new Date().toISOString() };
});

// ============ ANTI-HABITS ENDPOINTS ============
const antiHabits = [
  { id: 'anti-1', userId: 'demo-user-123', name: 'No phone after 22:45', cleanStreak: 3, targetMins: 15 }
];

fastify.get('/v1/antihabits', {
  schema: { tags: ['Anti-Habits'], summary: 'List user anti-habits', response: { 200: { type: 'array' }}}
}, async (request, reply) => {
  return antiHabits.filter(a => a.userId === 'demo-user-123');
});

fastify.post('/v1/antihabits/:id/slip', {
  schema: { tags: ['Anti-Habits'], summary: 'Record anti-habit slip', response: { 200: { type: 'object' }}}
}, async (request, reply) => {
  const antiHabitId = request.params.id;
  const antiHabit = antiHabits.find(a => a.id === antiHabitId);
  
  if (antiHabit) {
    antiHabit.cleanStreak = 0;
    console.log(`❌ Anti-habit "${antiHabit.name}" slip recorded. Streak reset.`);
  }
  
  return { ok: true, timestamp: new Date().toISOString() };
});

// ============ CHAT ENDPOINT ============
fastify.post('/v1/chat', {
  schema: {
    tags: ['Chat'],
    summary: 'Send message to Drill Sergeant AI',
    body: { type: 'object', properties: { message: { type: 'string' }, mode: { type: 'string' }}},
    response: { 200: { type: 'object', properties: { reply: { type: 'string' }, confidence: { type: 'number' }}}}
  }
}, async (request, reply) => {
  const { message, mode = 'balanced' } = request.body;
  console.log(`💬 Chat: "${message}" (${mode})`);
  
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

// ============ BRIEF ENDPOINT ============
fastify.get('/v1/brief/today', {
  schema: {
    tags: ['Brief'],
    summary: 'Get daily brief with missions and targets',
    response: { 200: { type: 'object' }}
  }
}, async (request, reply) => {
  const userHabits = habits.filter(h => h.userId === 'demo-user-123');
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

// ============ VOICE ENDPOINTS ============
fastify.get('/v1/voice/preset/:id', {
  schema: { tags: ['Voice'], summary: 'Get preset audio URL', response: { 200: { type: 'object' }}}
}, async (request, reply) => {
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

// ============ ALARMS ENDPOINTS ============
const alarms = [
  { id: 'alarm-1', userId: 'demo-user-123', label: 'Morning Workout', rrule: 'FREQ=DAILY;BYHOUR=7', enabled: true }
];

fastify.get('/v1/alarms', {
  schema: { tags: ['Alarms'], summary: 'List user alarms', response: { 200: { type: 'array' }}}
}, async (request, reply) => {
  return alarms.filter(a => a.userId === 'demo-user-123');
});

fastify.post('/v1/alarms', {
  schema: { tags: ['Alarms'], summary: 'Create new alarm', response: { 201: { type: 'object' }}}
}, async (request, reply) => {
  const alarm = { id: `alarm-${Date.now()}`, userId: 'demo-user-123', ...request.body, enabled: true };
  alarms.push(alarm);
  reply.code(201);
  return alarm;
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    // Generate OpenAPI spec
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    console.log('🚀 DrillSergeant API running on http://localhost:8080');
    console.log('�� API docs available at http://localhost:8080/docs');
    console.log('📄 OpenAPI spec generated at ./openapi.json');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
