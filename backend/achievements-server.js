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
    info: { title: 'DrillSergeant API v5 (Achievements)', version: '1.0.0' },
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
    plan: 'PRO',
    tz: 'America/New_York',
    createdAt: '2024-01-01T00:00:00Z',
    features: { canUseDynamicTts: true, llmQuotaRemaining: 100, ttsQuotaRemaining: 5000 },
    stats: {
      totalTicks: 42,
      longestStreak: 15,
      totalDaysActive: 30,
      achievementsUnlocked: 3
    }
  }
};

const habits = [
  { 
    id: 'habit-1', 
    userId: 'demo-user-123', 
    title: 'Morning Workout', 
    streak: 7, 
    schedule: { time: '07:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }, 
    lastTick: new Date().toISOString(),
    context: { difficulty: 2, category: 'fitness', lifeDays: 0.5 },
    createdAt: '2024-01-01T00:00:00Z',
    achievements: []
  },
  { 
    id: 'habit-2', 
    userId: 'demo-user-123', 
    title: 'Read 30 Minutes', 
    streak: 30, 
    schedule: { time: '20:00', days: ['daily'] }, 
    lastTick: new Date().toISOString(),
    context: { difficulty: 1, category: 'learning', lifeDays: 0.3 },
    createdAt: '2024-01-01T00:00:00Z',
    achievements: ['first_week', 'consistency_king']
  }
];

const antiHabits = [
  { 
    id: 'anti-1', 
    userId: 'demo-user-123', 
    name: 'No phone after 22:45', 
    cleanStreak: 5, 
    targetMins: 15, 
    lastSlip: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dangerWin: { hours: [20, 21, 22, 23] },
    interceptionEnabled: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Achievement definitions
const ACHIEVEMENTS = {
  // Streak milestones
  first_week: {
    id: 'first_week',
    title: '�� First Week',
    description: 'Complete 7 days in a row',
    threshold: 7,
    type: 'streak',
    rarity: 'common',
    xp: 100,
    audioPresetId: 'praise_week'
  },
  
  two_weeks: {
    id: 'two_weeks',
    title: '⚡ Momentum Builder',
    description: '14 days of consistency',
    threshold: 14,
    type: 'streak',
    rarity: 'common',
    xp: 200,
    audioPresetId: 'praise_fortnight'
  },
  
  one_month: {
    id: 'one_month',
    title: '💪 Iron Will',
    description: '30 days of dedication',
    threshold: 30,
    type: 'streak',
    rarity: 'uncommon',
    xp: 500,
    audioPresetId: 'praise_month'
  },
  
  two_months: {
    id: 'two_months',
    title: '🏆 Habit Master',
    description: '60 days of excellence',
    threshold: 60,
    type: 'streak',
    rarity: 'rare',
    xp: 1000,
    audioPresetId: 'praise_master'
  },
  
  three_months: {
    id: 'three_months',
    title: '👑 Discipline King',
    description: '90 days of unwavering commitment',
    threshold: 90,
    type: 'streak',
    rarity: 'epic',
    xp: 2000,
    audioPresetId: 'praise_king'
  },
  
  six_months: {
    id: 'six_months',
    title: '🌟 Legend',
    description: '180 days of legendary consistency',
    threshold: 180,
    type: 'streak',
    rarity: 'legendary',
    xp: 5000,
    audioPresetId: 'praise_legend'
  },
  
  one_year: {
    id: 'one_year',
    title: '🏅 Immortal',
    description: '365 days of immortal discipline',
    threshold: 365,
    type: 'streak',
    rarity: 'mythic',
    xp: 10000,
    audioPresetId: 'praise_immortal'
  },
  
  // Special achievements
  consistency_king: {
    id: 'consistency_king',
    title: '👑 Consistency King',
    description: 'Maintain 90%+ consistency for 30 days',
    threshold: 30,
    type: 'consistency',
    rarity: 'rare',
    xp: 750,
    audioPresetId: 'praise_consistent'
  },
  
  comeback_kid: {
    id: 'comeback_kid',
    title: '🔄 Comeback Kid',
    description: 'Rebuild a streak after breaking it',
    threshold: 1,
    type: 'comeback',
    rarity: 'uncommon',
    xp: 300,
    audioPresetId: 'praise_comeback'
  },
  
  early_bird: {
    id: 'early_bird',
    title: '🌅 Early Bird',
    description: 'Complete habits before 8 AM for 7 days',
    threshold: 7,
    type: 'early_completion',
    rarity: 'common',
    xp: 150,
    audioPresetId: 'praise_early'
  },
  
  night_owl: {
    id: 'night_owl',
    title: '🦉 Night Owl',
    description: 'Complete evening habits consistently',
    threshold: 14,
    type: 'late_completion',
    rarity: 'common',
    xp: 150,
    audioPresetId: 'praise_night'
  },
  
  perfectionist: {
    id: 'perfectionist',
    title: '💎 Perfectionist',
    description: '100% completion rate for 14 days',
    threshold: 14,
    type: 'perfect_days',
    rarity: 'epic',
    xp: 1500,
    audioPresetId: 'praise_perfect'
  }
};

const events = [];
const userAchievements = new Map(); // userId -> [achievements]
const pendingCelebrations = new Map(); // userId -> [celebrations]

// ============ CORE UTILITIES ============
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
      sessionId: metadata.sessionId || 'default'
    }
  };
  
  events.push(event);
  console.log(`📝 Event logged: ${type} for user ${userId}`);
  
  return event;
}

// ============ ACHIEVEMENTS ENGINE ============
function checkAchievements(userId, habitId) {
  console.log(`🏆 Checking achievements for user ${userId}, habit ${habitId}`);
  
  const habit = habits.find(h => h.id === habitId && h.userId === userId);
  if (!habit) return [];
  
  const user = users[userId];
  const userAchievementsList = userAchievements.get(userId) || [];
  const newAchievements = [];
  
  // Check streak milestones
  const streakThresholds = [7, 14, 30, 60, 90, 180, 365];
  for (const threshold of streakThresholds) {
    const achievementKey = getStreakAchievementKey(threshold);
    const achievement = ACHIEVEMENTS[achievementKey];
    
    if (achievement && habit.streak === threshold) {
      const existingAchievement = userAchievementsList.find(a => 
        a.achievementId === achievement.id && a.habitId === habitId
      );
      
      if (!existingAchievement) {
        const newAchievement = {
          id: generateId(),
          userId,
          habitId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
          ...achievement
        };
        
        newAchievements.push(newAchievement);
        userAchievementsList.push(newAchievement);
        
        // Log achievement unlock event
        logEvent(userId, 'achievement_unlocked', {
          achievementId: achievement.id,
          habitId,
          habitTitle: habit.title,
          streak: habit.streak,
          xp: achievement.xp,
          rarity: achievement.rarity
        });
        
        // Queue celebration
        queueCelebration(userId, newAchievement);
        
        console.log(`🎉 ACHIEVEMENT UNLOCKED: ${achievement.title} for "${habit.title}" (${habit.streak} days)`);
      }
    }
  }
  
  // Check special achievements
  checkSpecialAchievements(userId, habit, newAchievements, userAchievementsList);
  
  // Update user achievements
  userAchievements.set(userId, userAchievementsList);
  
  return newAchievements;
}

function getStreakAchievementKey(threshold) {
  const mapping = {
    7: 'first_week',
    14: 'two_weeks',
    30: 'one_month',
    60: 'two_months',
    90: 'three_months',
    180: 'six_months',
    365: 'one_year'
  };
  return mapping[threshold];
}

function checkSpecialAchievements(userId, habit, newAchievements, userAchievementsList) {
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userEvents = events.filter(e => e.userId === userId);
  
  // Consistency King: 90%+ consistency for 30 days
  if (habit.streak >= 30) {
    const tickEvents = userEvents.filter(e => e.type === 'habit_tick' && e.payload.habitId === habit.id);
    const last30Days = tickEvents.slice(-30);
    const consistency = last30Days.length >= 27; // 90% of 30 days
    
    if (consistency && !userAchievementsList.find(a => a.achievementId === 'consistency_king' && a.habitId === habit.id)) {
      const achievement = ACHIEVEMENTS.consistency_king;
      const newAchievement = {
        id: generateId(),
        userId,
        habitId: habit.id,
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        ...achievement
      };
      
      newAchievements.push(newAchievement);
      userAchievementsList.push(newAchievement);
      queueCelebration(userId, newAchievement);
      
      logEvent(userId, 'achievement_unlocked', {
        achievementId: achievement.id,
        habitId: habit.id,
        habitTitle: habit.title,
        consistency: '90%+',
        xp: achievement.xp
      });
    }
  }
  
  // Early Bird: Complete before 8 AM for 7 days
  const morningTicks = userEvents.filter(e => 
    e.type === 'habit_tick' && 
    e.payload.habitId === habit.id &&
    new Date(e.ts).getHours() < 8
  ).slice(-7);
  
  if (morningTicks.length >= 7 && !userAchievementsList.find(a => a.achievementId === 'early_bird' && a.habitId === habit.id)) {
    const achievement = ACHIEVEMENTS.early_bird;
    const newAchievement = {
      id: generateId(),
      userId,
      habitId: habit.id,
      achievementId: achievement.id,
      unlockedAt: new Date().toISOString(),
      ...achievement
    };
    
    newAchievements.push(newAchievement);
    userAchievementsList.push(newAchievement);
    queueCelebration(userId, newAchievement);
  }
}

function queueCelebration(userId, achievement) {
  const celebrations = pendingCelebrations.get(userId) || [];
  
  const celebration = {
    id: generateId(),
    type: 'achievement_unlock',
    achievement,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  
  celebrations.push(celebration);
  pendingCelebrations.set(userId, celebrations);
  
  console.log(`🎊 Celebration queued: ${achievement.title} (${achievement.rarity})`);
}

// ============ CELEBRATION SYSTEM ============
function generatePraiseText(achievement, habitTitle) {
  const rarityPhrases = {
    common: ['Nice work!', 'Keep it up!', 'Well done!'],
    uncommon: ['Impressive!', 'Outstanding!', 'Excellent work!'],
    rare: ['Remarkable!', 'Exceptional!', 'Truly impressive!'],
    epic: ['LEGENDARY!', 'PHENOMENAL!', 'ABSOLUTELY EPIC!'],
    legendary: ['BEYOND LEGENDARY!', 'GODLIKE!', 'IMMORTAL ACHIEVEMENT!'],
    mythic: ['TRANSCENDENT!', 'MYTHICAL!', 'BEYOND MORTAL LIMITS!']
  };
  
  const phrases = rarityPhrases[achievement.rarity] || rarityPhrases.common;
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  return `${randomPhrase} You've unlocked "${achievement.title}" for "${habitTitle}"! ${achievement.description}`;
}

// ============ API ENDPOINTS ============

// Achievements endpoints
fastify.get('/v1/achievements', {
  schema: {
    tags: ['Achievements'],
    summary: 'Get user achievements',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userAchievementsList = userAchievements.get(request.user.id) || [];
  
  // Group by habit
  const achievementsByHabit = {};
  userAchievementsList.forEach(achievement => {
    if (!achievementsByHabit[achievement.habitId]) {
      achievementsByHabit[achievement.habitId] = [];
    }
    achievementsByHabit[achievement.habitId].push(achievement);
  });
  
  // Calculate total stats
  const totalXP = userAchievementsList.reduce((sum, a) => sum + a.xp, 0);
  const rarityCount = userAchievementsList.reduce((counts, a) => {
    counts[a.rarity] = (counts[a.rarity] || 0) + 1;
    return counts;
  }, {});
  
  return {
    total: userAchievementsList.length,
    totalXP,
    rarityBreakdown: rarityCount,
    byHabit: achievementsByHabit,
    recent: userAchievementsList
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 5)
  };
});

fastify.get('/v1/achievements/available', {
  schema: {
    tags: ['Achievements'],
    summary: 'Get all available achievements',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userAchievementsList = userAchievements.get(request.user.id) || [];
  const unlockedIds = new Set(userAchievementsList.map(a => a.achievementId));
  
  const availableAchievements = Object.values(ACHIEVEMENTS).map(achievement => ({
    ...achievement,
    unlocked: unlockedIds.has(achievement.id),
    progress: calculateAchievementProgress(request.user.id, achievement)
  }));
  
  return {
    achievements: availableAchievements,
    categories: {
      streak: availableAchievements.filter(a => a.type === 'streak'),
      special: availableAchievements.filter(a => a.type !== 'streak')
    }
  };
});

function calculateAchievementProgress(userId, achievement) {
  const userHabits = habits.filter(h => h.userId === userId);
  
  if (achievement.type === 'streak') {
    const maxStreak = Math.max(...userHabits.map(h => h.streak), 0);
    return Math.min((maxStreak / achievement.threshold) * 100, 100);
  }
  
  // For other achievement types, return basic progress
  return 0;
}

// Celebrations endpoints
fastify.get('/v1/celebrations', {
  schema: {
    tags: ['Celebrations'],
    summary: 'Get pending celebrations',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const celebrations = pendingCelebrations.get(request.user.id) || [];
  return celebrations.filter(c => c.status === 'pending');
});

fastify.post('/v1/celebrations/:id/acknowledge', {
  schema: {
    tags: ['Celebrations'],
    summary: 'Acknowledge a celebration',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const celebrationId = request.params.id;
  const celebrations = pendingCelebrations.get(request.user.id) || [];
  
  const celebration = celebrations.find(c => c.id === celebrationId);
  if (celebration) {
    celebration.status = 'acknowledged';
    celebration.acknowledgedAt = new Date().toISOString();
    
    logEvent(request.user.id, 'celebration_acknowledged', {
      celebrationId,
      achievementId: celebration.achievement.id
    });
  }
  
  return { ok: true };
});

// Enhanced brief with achievements
fastify.get('/v1/brief/today', {
  schema: {
    tags: ['Brief'],
    summary: 'Get daily brief with achievements',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const userId = request.user.id;
  const user = users[userId];
  const userHabits = habits.filter(h => h.userId === userId);
  const userAchievementsList = userAchievements.get(userId) || [];
  const celebrations = pendingCelebrations.get(userId) || [];
  
  const now = new Date();
  const today = now.toDateString();
  
  // Today's progress
  const habitsToday = userHabits.map(habit => {
    const tickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
    const nextMilestone = getNextMilestone(habit.streak);
    
    return {
      ...habit,
      status: tickedToday ? 'completed' : 'pending',
      nextMilestone,
      daysToMilestone: nextMilestone ? nextMilestone - habit.streak : null,
      recentAchievements: userAchievementsList
        .filter(a => a.habitId === habit.id)
        .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
        .slice(0, 2)
    };
  });
  
  // Calculate user level and XP
  const totalXP = userAchievementsList.reduce((sum, a) => sum + a.xp, 0);
  const level = Math.floor(totalXP / 1000) + 1;
  const xpToNextLevel = (level * 1000) - totalXP;
  
  return {
    user: {
      rank: getRankByLevel(level),
      xp: totalXP,
      level,
      xpToNextLevel,
      achievementsUnlocked: userAchievementsList.length
    },
    
    habits: habitsToday,
    
    achievements: {
      total: userAchievementsList.length,
      recent: userAchievementsList.slice(-3),
      pendingCelebrations: celebrations.filter(c => c.status === 'pending').length
    },
    
    streaks: {
      longest: Math.max(...userHabits.map(h => h.streak), 0),
      active: userHabits.filter(h => h.streak > 0).length,
      total: userHabits.length
    },
    
    missions: generateMissions(userHabits, userAchievementsList),
    
    celebrationReady: celebrations.some(c => c.status === 'pending')
  };
});

function getNextMilestone(currentStreak) {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  return milestones.find(m => m > currentStreak);
}

function getRankByLevel(level) {
  if (level >= 50) return 'General';
  if (level >= 25) return 'Colonel';
  if (level >= 15) return 'Major';
  if (level >= 10) return 'Captain';
  if (level >= 5) return 'Lieutenant';
  return 'Sergeant';
}

function generateMissions(habits, achievements) {
  const missions = [];
  
  // Habit completion missions
  habits.forEach(habit => {
    const today = new Date().toDateString();
    const tickedToday = habit.lastTick && new Date(habit.lastTick).toDateString() === today;
    
    if (!tickedToday) {
      const nextMilestone = getNextMilestone(habit.streak);
      const daysToMilestone = nextMilestone ? nextMilestone - habit.streak : null;
      
      missions.push({
        id: `tick-${habit.id}`,
        type: 'habit_completion',
        title: `Complete ${habit.title}`,
        description: daysToMilestone 
          ? `${daysToMilestone} days to ${nextMilestone}-day milestone!`
          : `Build on your ${habit.streak}-day streak`,
        action: 'tick_habit',
        habitId: habit.id,
        priority: habit.streak > 7 ? 'high' : 'medium',
        xpReward: 50 + (habit.streak * 2)
      });
    }
  });
  
  return missions.slice(0, 5);
}

// ============ HABIT ENDPOINTS WITH ACHIEVEMENTS ============
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
  
  let newAchievements = [];
  
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
    
    // Check for achievements
    newAchievements = checkAchievements(request.user.id, habitId);
    
    console.log(`✅ Habit "${habit.title}" ticked! Streak: ${previousStreak} → ${habit.streak}`);
    
    if (newAchievements.length > 0) {
      console.log(`🎉 ${newAchievements.length} new achievements unlocked!`);
    }
  }
  
  return {
    ok: true,
    streak: habit.streak,
    timestamp: habit.lastTick,
    idempotent: alreadyTickedToday,
    achievements: newAchievements,
    celebrationReady: newAchievements.length > 0
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

// ============ INITIALIZATION ============
function initializeAchievements() {
  console.log('🏆 Initializing Achievement System...');
  
  // Initialize user achievements
  const userId = 'demo-user-123';
  userAchievements.set(userId, [
    {
      id: generateId(),
      userId,
      habitId: 'habit-2',
      achievementId: 'first_week',
      unlockedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      ...ACHIEVEMENTS.first_week
    },
    {
      id: generateId(),
      userId,
      habitId: 'habit-2',
      achievementId: 'two_weeks',
      unlockedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      ...ACHIEVEMENTS.two_weeks
    },
    {
      id: generateId(),
      userId,
      habitId: 'habit-2',
      achievementId: 'one_month',
      unlockedAt: new Date().toISOString(),
      ...ACHIEVEMENTS.one_month
    }
  ]);
  
  // Queue a sample celebration
  queueCelebration(userId, {
    id: 'sample-achievement',
    title: '🎉 Welcome Achievement',
    description: 'You\'re ready to unlock greatness!',
    rarity: 'common',
    xp: 50
  });
  
  console.log('✅ Achievement system initialized with sample data');
}

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    require('fs').writeFileSync('./openapi.json', JSON.stringify(spec, null, 2));
    
    initializeAchievements();
    
    console.log('🚀 DrillSergeant API v5 (Achievements + Streaks) running on http://localhost:8080');
    console.log('📚 API docs: http://localhost:8080/docs');
    console.log('✅ Features: Achievement system, Streak milestones, Celebration queue');
    console.log('🏆 Gamification: XP system, Ranks, Milestone tracking, Confetti celebrations');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
