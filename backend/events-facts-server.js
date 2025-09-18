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
    info: { title: 'DrillSergeant API v4 (Events + Facts)', version: '1.0.0' },
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

// ============ DATA STORES ============
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
    lastTick: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    context: { difficulty: 2, category: 'fitness', lifeDays: 0.5 },
    createdAt: '2024-01-01T00:00:00Z' 
  },
  { 
    id: 'habit-2', 
    userId: 'demo-user-123', 
    title: 'Read 30 Minutes', 
    streak: 3, 
    schedule: { time: '20:00', days: ['daily'] }, 
    lastTick: new Date().toISOString(),
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
    lastSlip: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    dangerWin: { hours: [20, 21, 22, 23] },
    interceptionEnabled: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Events log - comprehensive tracking
const events = [];

// User facts - computed insights
const userFacts = new Map();

// Rules state - track last notifications to avoid spam
const rulesState = new Map();

// Alarms (simplified for this phase)
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
  }
];

// ============ CORE UTILITIES ============
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

// Event logging utility - ENHANCED
function logEvent(userId, type, payload, metadata = {}) {
  const event = {
    id: generateId(),
    userId,
    ts: new Date().toISOString(),
    type,
    payload,
    metadata: {
      ...metadata,
      source: 'api',
      sessionId: metadata.sessionId || 'default',
      userAgent: metadata.userAgent || 'unknown'
    }
  };
  
  events.push(event);
  console.log(`📝 Event logged: ${type} for user ${userId}`);
  
  // Trigger rules engine asynchronously
  setTimeout(() => evaluateRules(userId, event), 0);
  
  // Trigger facts recomputation if significant event
  const significantEvents = ['habit_tick', 'antihabit_slip', 'streak_at_risk', 'alarm_fire'];
  if (significantEvents.includes(type)) {
    setTimeout(() => recomputeUserFacts(userId), 100);
  }
  
  return event;
}

// ============ USER FACTS ENGINE ============
function recomputeUserFacts(userId) {
  console.log(`🧠 Recomputing facts for user ${userId}`);
  
  const userEvents = events.filter(e => e.userId === userId);
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Recent events analysis
  const recentEvents = userEvents.filter(e => new Date(e.ts) > last7Days);
  const slipEvents = recentEvents.filter(e => e.type === 'antihabit_slip');
  const tickEvents = recentEvents.filter(e => e.type === 'habit_tick');
  
  // Danger hours analysis
  const dangerHours = new Set();
  slipEvents.forEach(event => {
    const hour = new Date(event.ts).getHours();
    dangerHours.add(hour);
  });
  
  // Weak habits detection
  const weakHabits = userHabits.filter(habit => {
    if (!habit.lastTick) return true;
    
    const daysSinceLastTick = Math.floor((now - new Date(habit.lastTick)) / (24 * 60 * 60 * 1000));
    return daysSinceLastTick >= 2 && habit.streak > 0;
  });
  
  // Streak risk analysis
  const streakAtRisk = weakHabits.filter(habit => {
    const hour = now.getHours();
    return hour >= 18 && habit.streak >= 3; // Evening + meaningful streak
  });
  
  // Performance trends
  const ticksLast7 = tickEvents.length;
  const ticksLast14 = userEvents.filter(e => 
    e.type === 'habit_tick' && new Date(e.ts) > last14Days
  ).length;
  
  const slipsLast7 = slipEvents.length;
  const slipsLast30 = userEvents.filter(e => 
    e.type === 'antihabit_slip' && new Date(e.ts) > last30Days
  ).length;
  
  // Compute facts
  const facts = {
    userId,
    computedAt: now.toISOString(),
    
    // Risk factors
    dangerHours: Array.from(dangerHours).sort(),
    weakHabits: weakHabits.map(h => ({ id: h.id, title: h.title, daysSinceLastTick: Math.floor((now - new Date(h.lastTick || 0)) / (24 * 60 * 60 * 1000)) })),
    streakAtRisk: streakAtRisk.map(h => ({ id: h.id, title: h.title, streak: h.streak })),
    
    // Performance metrics
    performance: {
      ticksLast7Days: ticksLast7,
      ticksLast14Days: ticksLast14,
      slipsLast7Days: slipsLast7,
      slipsLast30Days: slipsLast30,
      consistency: ticksLast14 > 0 ? Math.round((ticksLast7 / (ticksLast14 / 2)) * 100) : 0,
      discipline: slipsLast30 > 0 ? Math.max(0, 100 - slipsLast7 * 10) : 100
    },
    
    // Behavioral patterns
    patterns: {
      mostActiveHour: getMostActiveHour(tickEvents),
      mostVulnerableHour: getMostVulnerableHour(slipEvents),
      longestStreak: Math.max(...userHabits.map(h => h.streak), 0),
      totalHabits: userHabits.length,
      activeAntiHabits: userAntiHabits.filter(a => a.interceptionEnabled).length
    },
    
    // Current status
    status: {
      needsAttention: streakAtRisk.length > 0,
      inDangerWindow: dangerHours.has(now.getHours()),
      overallHealth: computeOverallHealth(ticksLast7, slipsLast7, streakAtRisk.length)
    }
  };
  
  userFacts.set(userId, facts);
  console.log(`✅ Facts updated for ${userId}: ${facts.status.overallHealth} health, ${streakAtRisk.length} at risk`);
  
  return facts;
}

function getMostActiveHour(tickEvents) {
  const hourCounts = {};
  tickEvents.forEach(event => {
    const hour = new Date(event.ts).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  let maxHour = null, maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxHour = parseInt(hour);
      maxCount = count;
    }
  }
  
  return maxHour;
}

function getMostVulnerableHour(slipEvents) {
  const hourCounts = {};
  slipEvents.forEach(event => {
    const hour = new Date(event.ts).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  let maxHour = null, maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxHour = parseInt(hour);
      maxCount = count;
    }
  }
  
  return maxHour;
}

function computeOverallHealth(ticks7, slips7, atRisk) {
  let score = 70; // Base score
  score += Math.min(ticks7 * 5, 20); // +5 per tick, max 20
  score -= Math.min(slips7 * 10, 30); // -10 per slip, max -30
  score -= atRisk * 15; // -15 per habit at risk
  
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 30) return 'poor';
  return 'critical';
}

// ============ RULES ENGINE ============
function evaluateRules(userId, triggerEvent) {
  console.log(`🔄 Rules engine processing for user ${userId}, trigger: ${triggerEvent.type}`);
  
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  const facts = userFacts.get(userId);
  const now = new Date();
  
  // Get or initialize rules state for this user
  if (!rulesState.has(userId)) {
    rulesState.set(userId, {
      lastStreakWarning: null,
      lastDangerAlert: null,
      lastPerformanceCheck: null,
      notificationCount24h: 0,
      lastNotificationReset: now.toISOString()
    });
  }
  
  const state = rulesState.get(userId);
  
  // Reset daily notification counter
  const lastReset = new Date(state.lastNotificationReset);
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    state.notificationCount24h = 0;
    state.lastNotificationReset = now.toISOString();
  }
  
  // Prevent notification spam (max 5 per day)
  if (state.notificationCount24h >= 5) {
    console.log('🚫 Notification limit reached for today');
    return;
  }
  
  // RULE 1: Streak at risk detection
  if (triggerEvent.type === 'hourly_check' || triggerEvent.type === 'habit_tick') {
    const today = now.toDateString();
    const hour = now.getHours();
    
    for (const habit of userHabits) {
      const lastTick = habit.lastTick ? new Date(habit.lastTick) : null;
      const tickedToday = lastTick && lastTick.toDateString() === today;
      
      if (!tickedToday && habit.streak >= 3 && hour >= 18) {
        const lastWarning = state.lastStreakWarning ? new Date(state.lastStreakWarning) : null;
        const hoursSinceWarning = lastWarning ? (now - lastWarning) / (60 * 60 * 1000) : 24;
        
        if (hoursSinceWarning >= 4) { // Max 1 warning per 4 hours
          console.log(`⚠️  RULE: Streak at risk for "${habit.title}" (${habit.streak} days)`);
          
          logEvent(userId, 'streak_at_risk', {
            habitId: habit.id,
            title: habit.title,
            streak: habit.streak,
            detectedAt: now.toISOString(),
            severity: habit.streak >= 7 ? 'high' : 'medium'
          });
          
          sendNotification(userId, 'streak_warning', {
            title: `🔥 ${habit.title} streak at risk!`,
            body: `Your ${habit.streak}-day streak needs attention. Take action now!`,
            habitId: habit.id
          });
          
          state.lastStreakWarning = now.toISOString();
          state.notificationCount24h++;
        }
      }
    }
  }
  
  // RULE 2: Anti-habit danger window
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
          detectedAt: now.toISOString(),
          severity: 'high'
        });
        
        sendNotification(userId, 'danger_slip', {
          title: `🚨 Stand down!`,
          body: `${antiHabit.name} slip detected in danger window. Regroup immediately!`,
          antiHabitId: antiHabit.id
        });
        
        state.notificationCount24h++;
      }
    }
  }
  
  // RULE 3: Performance degradation
  if (triggerEvent.type === 'hourly_check' && facts) {
    const performance = facts.performance;
    const lastCheck = state.lastPerformanceCheck ? new Date(state.lastPerformanceCheck) : null;
    const hoursSinceCheck = lastCheck ? (now - lastCheck) / (60 * 60 * 1000) : 24;
    
    if (hoursSinceCheck >= 12 && performance.consistency < 50 && performance.discipline < 60) {
      console.log(`📉 RULE: Performance degradation detected`);
      
      logEvent(userId, 'performance_alert', {
        consistency: performance.consistency,
        discipline: performance.discipline,
        detectedAt: now.toISOString(),
        severity: 'medium'
      });
      
      sendNotification(userId, 'performance_warning', {
        title: '📊 Performance check',
        body: `Consistency at ${performance.consistency}%. Time to refocus, soldier!`,
        actionRequired: true
      });
      
      state.lastPerformanceCheck = now.toISOString();
      state.notificationCount24h++;
    }
  }
  
  // RULE 4: Milestone celebration
  if (triggerEvent.type === 'habit_tick') {
    const habit = userHabits.find(h => h.id === triggerEvent.payload.habitId);
    if (habit && [7, 14, 30, 60, 90, 180, 365].includes(habit.streak)) {
      console.log(`🎉 RULE: Milestone reached for "${habit.title}" - ${habit.streak} days!`);
      
      logEvent(userId, 'milestone_reached', {
        habitId: habit.id,
        title: habit.title,
        streak: habit.streak,
        milestone: habit.streak,
        detectedAt: now.toISOString()
      });
      
      sendNotification(userId, 'milestone_celebration', {
        title: `🏆 ${habit.streak}-Day Milestone!`,
        body: `Outstanding work on "${habit.title}"! You're building something legendary.`,
        celebratory: true
      });
    }
  }
  
  // Update rules state
  rulesState.set(userId, state);
}

// Mock notification sender
function sendNotification(userId, type, payload) {
  console.log(`📱 NOTIFICATION [${type}] for ${userId}:`);
  console.log(`   Title: ${payload.title}`);
  console.log(`   Body: ${payload.body}`);
  
  // In production, this would:
  // 1. Send FCM push notification
  // 2. Create in-app notification
  // 3. Potentially send SMS for critical alerts
  // 4. Log to notification history
  
  return { sent: true, type, payload, timestamp: new Date().toISOString() };
}

// ============ API ENDPOINTS ============

// Events endpoints
fastify.get('/v1/events', {
  schema: {
    tags: ['Events'],
    summary: 'Get user events',
    security: [{ bearerAuth: [] }],
    querystring: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        limit: { type: 'number', default: 50 },
        since: { type: 'string', format: 'date-time' }
      }
    }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { type, limit = 50, since } = request.query;
  
  let userEvents = events.filter(e => e.userId === request.user.id);
  
  if (type) {
    userEvents = userEvents.filter(e => e.type === type);
  }
  
  if (since) {
    userEvents = userEvents.filter(e => new Date(e.ts) > new Date(since));
  }
  
  userEvents.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  
  return userEvents.slice(0, limit);
});

// Facts endpoints
fastify.get('/v1/facts', {
  schema: {
    tags: ['Facts'],
    summary: 'Get user facts and insights',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  let facts = userFacts.get(request.user.id);
  
  if (!facts) {
    facts = recomputeUserFacts(request.user.id);
  }
  
  return facts;
});

fastify.post('/v1/facts/recompute', {
  schema: {
    tags: ['Facts'],
    summary: 'Force recompute user facts',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const facts = recomputeUserFacts(request.user.id);
  
  return {
    ok: true,
    message: 'Facts recomputed successfully',
    facts
  };
});

// Brief endpoint - enhanced with facts
fastify.get('/v1/brief/today', {
  schema: {
    tags: ['Brief'],
    summary: 'Get enhanced daily brief with insights',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userId = request.user.id;
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAntiHabits = antiHabits.filter(a => a.userId === userId);
  
  // Get or compute facts
  let facts = userFacts.get(userId);
  if (!facts) {
    facts = recomputeUserFacts(userId);
  }
  
  const now = new Date();
  const today = now.toDateString();
  
  // Today's progress
  const habitsToday = userHabits.map(habit => {
    const tickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
    return {
      ...habit,
      status: tickedToday ? 'completed' : 'pending',
      isAtRisk: facts.streakAtRisk.some(r => r.id === habit.id)
    };
  });
  
  // Recent events for context
  const recentEvents = events
    .filter(e => e.userId === userId && new Date(e.ts) > new Date(now - 6 * 60 * 60 * 1000))
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 5);
  
  // Intelligent missions based on facts
  const missions = generateIntelligentMissions(facts, habitsToday, user);
  
  return {
    user: {
      rank: 'Sergeant',
      xp: facts.performance.ticksLast7Days * 100 + facts.performance.discipline * 5,
      level: Math.floor(facts.patterns.longestStreak / 7) + 1
    },
    
    habits: habitsToday,
    antiHabits: userAntiHabits,
    
    facts: {
      overallHealth: facts.status.overallHealth,
      consistency: facts.performance.consistency,
      discipline: facts.performance.discipline,
      streaksAtRisk: facts.streakAtRisk.length,
      inDangerWindow: facts.status.inDangerWindow
    },
    
    missions,
    
    insights: generateInsights(facts, recentEvents),
    
    recentActivity: recentEvents.map(e => ({
      type: e.type,
      timestamp: e.ts,
      summary: generateEventSummary(e)
    }))
  };
});

function generateIntelligentMissions(facts, habits, user) {
  const missions = [];
  
  // Priority mission: Save streaks at risk
  facts.streakAtRisk.forEach(habit => {
    missions.push({
      id: `save-streak-${habit.id}`,
      type: 'critical',
      title: `🔥 Save ${habit.streak}-day streak`,
      description: `"${habit.title}" needs immediate attention`,
      action: 'tick_habit',
      habitId: habit.id,
      priority: 'high',
      urgency: 'immediate'
    });
  });
  
  // Standard habit missions
  const pendingHabits = habits.filter(h => h.status === 'pending' && !h.isAtRisk);
  pendingHabits.forEach(habit => {
    missions.push({
      id: `complete-${habit.id}`,
      type: 'standard',
      title: `Complete ${habit.title}`,
      description: `Build on your ${habit.streak}-day streak`,
      action: 'tick_habit',
      habitId: habit.id,
      priority: 'medium',
      urgency: 'today'
    });
  });
  
  // Performance improvement mission
  if (facts.performance.consistency < 70) {
    missions.push({
      id: 'improve-consistency',
      type: 'improvement',
      title: '📊 Boost consistency',
      description: `Current: ${facts.performance.consistency}%. Target: 80%+`,
      action: 'focus_mode',
      priority: 'medium',
      urgency: 'this_week'
    });
  }
  
  return missions.slice(0, 5); // Limit to top 5
}

function generateInsights(facts, recentEvents) {
  const insights = [];
  
  if (facts.status.overallHealth === 'excellent') {
    insights.push({
      type: 'positive',
      title: 'Peak Performance',
      message: 'You\'re operating at maximum efficiency. Keep this momentum!'
    });
  } else if (facts.status.overallHealth === 'poor' || facts.status.overallHealth === 'critical') {
    insights.push({
      type: 'warning',
      title: 'Course Correction Needed',
      message: 'Multiple systems need attention. Focus on one habit at a time.'
    });
  }
  
  if (facts.dangerHours.length > 0) {
    insights.push({
      type: 'insight',
      title: 'Vulnerability Pattern Detected',
      message: `You tend to slip at ${facts.dangerHours.join(', ')}:00. Plan accordingly.`
    });
  }
  
  if (facts.patterns.mostActiveHour !== null) {
    insights.push({
      type: 'positive',
      title: 'Peak Performance Window',
      message: `${facts.patterns.mostActiveHour}:00 is your most productive hour. Use it wisely.`
    });
  }
  
  return insights;
}

function generateEventSummary(event) {
  switch (event.type) {
    case 'habit_tick':
      return `Completed "${event.payload.title}" (${event.payload.streak} days)`;
    case 'antihabit_slip':
      return `Slip recorded for "${event.payload.name}"`;
    case 'streak_at_risk':
      return `${event.payload.title} streak (${event.payload.streak} days) at risk`;
    case 'alarm_fire':
      return `Alarm fired: ${event.payload.label}`;
    case 'milestone_reached':
      return `🏆 ${event.payload.streak}-day milestone: ${event.payload.title}`;
    default:
      return event.type.replace(/_/g, ' ');
  }
}

// ============ EXISTING ENDPOINTS (Habits, etc.) ============
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
    
    logEvent(request.user.id, 'habit_tick', {
      habitId,
      title: habit.title,
      streak: habit.streak,
      previousStreak
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

// Other core endpoints...
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
  
  // Log chat interaction
  logEvent(request.user.id, 'chat_interaction', { message, mode });
  
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

// ============ INITIALIZATION & CRON JOBS ============
function initializeSystem() {
  console.log('🧠 Initializing Events & Facts system...');
  
  // Seed some initial events for demo
  const userId = 'demo-user-123';
  const now = new Date();
  
  // Simulate some historical events
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    if (i < 3) { // Recent slips
      events.push({
        id: generateId(),
        userId,
        ts: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        type: 'antihabit_slip',
        payload: { antiHabitId: 'anti-1', name: 'No phone after 22:45' },
        metadata: { source: 'seed' }
      });
    }
    
    if (i > 2) { // Some habit ticks
      events.push({
        id: generateId(),
        userId,
        ts: new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        type: 'habit_tick',
        payload: { habitId: 'habit-2', title: 'Read 30 Minutes', streak: 5 - i },
        metadata: { source: 'seed' }
      });
    }
  }
  
  // Initial facts computation
  recomputeUserFacts(userId);
  
  console.log(`✅ System initialized with ${events.length} seed events`);
}

// Hourly rules evaluation
cron.schedule('0 * * * *', () => {
  console.log('⏰ Hourly rules evaluation triggered');
  
  for (const userId of Object.keys(users)) {
    evaluateRules(userId, { type: 'hourly_check', ts: new Date().toISOString() });
  }
});

// Facts recomputation (every 4 hours)
cron.schedule('0 */4 * * *', () => {
  console.log('🧠 Scheduled facts recomputation');
  
  for (const userId of Object.keys(users)) {
    recomputeUserFacts(userId);
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    // Initialize system after server starts
    initializeSystem();
    
    console.log('🚀 DrillSergeant API v4 (Events + Facts + Rules) running on http://localhost:8080');
    console.log('📚 API docs: http://localhost:8080/docs');
    console.log('✅ Features: Event logging, User facts, Rules engine, Smart notifications');
    console.log('🧠 Intelligence: Pattern detection, Risk analysis, Performance tracking');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
