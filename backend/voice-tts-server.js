const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');
const cron = require('node-cron');
const { OpenAI } = require('openai');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Simple UUID generator
function generateId() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Environment configuration
const config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  // Voice IDs for different tones (replace with real ElevenLabs voice IDs)
  VOICES: {
    strict: process.env.ELEVENLABS_VOICE_STRICT || 'pNInz6obpgDQGcFmaJgB', // Adam
    balanced: process.env.ELEVENLABS_VOICE_BALANCED || 'EXAVITQu4vr4xnSDxMaL', // Bella
    light: process.env.ELEVENLABS_VOICE_LIGHT || 'ErXwobaYiN019PkySvjV' // Antoni
  },
  VOICE_CACHE_DIR: './voice_cache',
  S3_BUCKET: process.env.S3_BUCKET || 'drillsergeant-voice',
  USE_REAL_ELEVENLABS: process.env.ELEVENLABS_API_KEY ? true : false
};

// OpenAI client
const openai = config.OPENAI_API_KEY ? new OpenAI({
  apiKey: config.OPENAI_API_KEY,
}) : null;

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
    info: { title: 'DrillSergeant API v6 (Voice + TTS)', version: '1.0.0' },
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
    features: { 
      canUseDynamicTts: true, 
      llmQuotaRemaining: 100, 
      ttsQuotaRemaining: 5000,
      ttsCharsUsedToday: 0,
      chatCallsToday: 0,
      lastQuotaReset: new Date().toISOString()
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
    createdAt: '2024-01-01T00:00:00Z'
  },
  { 
    id: 'habit-2', 
    userId: 'demo-user-123', 
    title: 'Read 30 Minutes', 
    streak: 30, 
    schedule: { time: '20:00', days: ['daily'] }, 
    lastTick: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Achievement definitions with voice presets
const ACHIEVEMENTS = {
  first_week: { 
    id: 'first_week', 
    title: '🔥 First Week', 
    description: 'Complete 7 days in a row', 
    threshold: 7, 
    type: 'streak', 
    rarity: 'common', 
    xp: 100, 
    audioPresetId: 'praise_week',
    voiceText: "Outstanding! Seven days of pure discipline. You're building something powerful here. Keep that fire burning!"
  },
  one_month: { 
    id: 'one_month', 
    title: '💪 Iron Will', 
    description: '30 days of dedication', 
    threshold: 30, 
    type: 'streak', 
    rarity: 'uncommon', 
    xp: 500, 
    audioPresetId: 'praise_month',
    voiceText: "Thirty days! You've forged iron will through consistent action. This is what legends are made of. Absolutely phenomenal!"
  }
};

const events = [];
const userAchievements = new Map();
const voiceCache = new Map();

// ============ ELEVENLABS TTS INTEGRATION ============
async function generateElevenLabsTTS(text, voiceId, userId) {
  const user = users[userId];
  
  // Check quotas
  if (user.plan === 'FREE') {
    throw new Error('Dynamic TTS requires PRO plan upgrade');
  }
  
  if (user.features.ttsCharsUsedToday + text.length > user.features.ttsQuotaRemaining) {
    throw new Error('TTS character quota exceeded for today');
  }
  
  // Create cache key
  const cacheKey = crypto.createHash('sha256').update(`${text}-${voiceId}`).digest('hex');
  
  // Check cache first
  if (voiceCache.has(cacheKey)) {
    console.log(`🎵 TTS cache hit for "${text.substring(0, 30)}..."`);
    return voiceCache.get(cacheKey);
  }
  
  console.log(`🎵 Generating TTS with ElevenLabs for "${text.substring(0, 50)}..." (voice: ${voiceId})`);
  
  if (!config.USE_REAL_ELEVENLABS) {
    console.log('⚠️  ElevenLabs API key not configured, using mock TTS');
    
    // Mock TTS generation with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockResult = {
      url: `https://mock-tts-cdn.com/audio/${cacheKey}.mp3`,
      text,
      voiceId,
      createdAt: new Date().toISOString(),
      source: 'mock'
    };
    
    voiceCache.set(cacheKey, mockResult);
    return mockResult;
  }
  
  try {
    // Real ElevenLabs API call
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    
    // Ensure cache directory exists
    await fs.mkdir(config.VOICE_CACHE_DIR, { recursive: true });
    
    // Save audio file locally
    const filename = `${cacheKey}.mp3`;
    const filepath = path.join(config.VOICE_CACHE_DIR, filename);
    await fs.writeFile(filepath, response.data);
    
    // In production, you'd upload to S3 here
    // const s3Url = await uploadToS3(filepath, filename);
    const localUrl = `http://localhost:8080/voice/cache/${filename}`;
    
    const result = {
      url: localUrl,
      text,
      voiceId,
      createdAt: new Date().toISOString(),
      source: 'elevenlabs',
      charCount: text.length,
      filepath
    };
    
    // Cache the result
    voiceCache.set(cacheKey, result);
    
    // Update user quota
    user.features.ttsCharsUsedToday += text.length;
    
    console.log(`✅ TTS generated successfully: ${filename} (${text.length} chars)`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ ElevenLabs TTS error: ${error.message}`);
    
    // Fallback to mock on error
    const fallbackResult = {
      url: `https://mock-tts-cdn.com/audio/${cacheKey}.mp3`,
      text,
      voiceId,
      createdAt: new Date().toISOString(),
      source: 'fallback',
      error: error.message
    };
    
    voiceCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

// Voice preset system
const VOICE_PRESETS = {
  praise_week: {
    strict: "Seven days down! This is discipline in action. Don't you dare slow down now!",
    balanced: "One week of consistency! You're building something powerful here. Keep it going!",
    light: "A beautiful week of progress. You should feel proud of this achievement."
  },
  
  praise_month: {
    strict: "THIRTY DAYS! You're becoming unstoppable. This is what separates the elite from the average!",
    balanced: "One month milestone! You've proven what's possible with dedication. Truly impressive!",
    light: "A full month of mindful progress. This is a beautiful transformation to witness."
  },
  
  streak_save: {
    strict: "Your streak is DYING! Move your ass right now and save what you've built!",
    balanced: "Your streak needs attention. Don't let today be the day you break. You've got this!",
    light: "Your streak is calling for some gentle attention. You've come so far already."
  },
  
  motivation_boost: {
    strict: "Stop making excuses! The only thing between you and success is action. MOVE!",
    balanced: "Time to step up. You have everything you need to succeed. Take that next step.",
    light: "Trust in your ability to grow. One mindful action at a time, you're becoming who you're meant to be."
  }
};

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
    metadata: { ...metadata, source: 'api' }
  };
  
  events.push(event);
  console.log(`📝 Event: ${type} for ${userId}`);
  return event;
}

// ============ VOICE & TTS ENDPOINTS ============

// Serve cached audio files
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, config.VOICE_CACHE_DIR),
  prefix: '/voice/cache/',
});

// Get voice preset with real TTS generation
fastify.get('/v1/voice/preset/:id', {
  schema: {
    tags: ['Voice'],
    summary: 'Get voice preset with TTS generation',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    querystring: {
      type: 'object',
      properties: {
        tone: { type: 'string', enum: ['strict', 'balanced', 'light'], default: 'balanced' }
      }
    }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const presetId = request.params.id;
  const tone = request.query.tone || 'balanced';
  
  const preset = VOICE_PRESETS[presetId];
  if (!preset) {
    reply.code(404).send({ error: 'Voice preset not found' });
    return;
  }
  
  const text = preset[tone] || preset.balanced;
  const voiceId = config.VOICES[tone];
  
  try {
    const ttsResult = await generateElevenLabsTTS(text, voiceId, request.user.id);
    
    logEvent(request.user.id, 'voice_preset_played', {
      presetId,
      tone,
      text: text.substring(0, 100),
      source: ttsResult.source
    });
    
    return {
      presetId,
      tone,
      text,
      audio: ttsResult,
      cached: ttsResult.source !== 'elevenlabs'
    };
    
  } catch (error) {
    reply.code(402).send({ error: error.message });
  }
});

// Dynamic TTS generation
fastify.post('/v1/voice/tts', {
  schema: {
    tags: ['Voice'],
    summary: 'Generate dynamic TTS',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 1000 },
        voice: { type: 'string', enum: ['strict', 'balanced', 'light'], default: 'balanced' }
      },
      required: ['text']
    }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { text, voice = 'balanced' } = request.body;
  const voiceId = config.VOICES[voice];
  
  try {
    const ttsResult = await generateElevenLabsTTS(text, voiceId, request.user.id);
    
    logEvent(request.user.id, 'tts_generated', {
      text: text.substring(0, 100),
      voice,
      charCount: text.length,
      source: ttsResult.source
    });
    
    return {
      text,
      voice,
      audio: ttsResult,
      usage: {
        charsUsed: text.length,
        charsRemaining: Math.max(0, users[request.user.id].features.ttsQuotaRemaining - users[request.user.id].features.ttsCharsUsedToday)
      }
    };
    
  } catch (error) {
    reply.code(402).send({ error: error.message });
  }
});

// Get TTS usage stats
fastify.get('/v1/voice/usage', {
  schema: {
    tags: ['Voice'],
    summary: 'Get TTS usage statistics',
    security: [{ bearerAuth: [] }]
  },
  preHandler: authenticate
}, async (request, reply) => {
  const user = users[request.user.id];
  
  return {
    plan: user.plan,
    canUseDynamicTts: user.features.canUseDynamicTts,
    quotaRemaining: user.features.ttsQuotaRemaining,
    charsUsedToday: user.features.ttsCharsUsedToday,
    lastReset: user.features.lastQuotaReset,
    cacheStats: {
      totalCached: voiceCache.size,
      cacheHitRate: '85%' // Mock stat
    }
  };
});

// ============ ENHANCED CHAT WITH VOICE RESPONSES ============
async function generateAIResponse(userId, message, mode, context) {
  const user = users[userId];
  
  // Check quotas
  if (user.features.chatCallsToday >= 50) {
    return {
      reply: "Daily chat limit reached. Upgrade to PRO for unlimited conversations.",
      source: 'quota_exceeded',
      hasVoice: false
    };
  }
  
  if (!openai) {
    console.log('🤖 No OpenAI API key, using CDS fallback');
    return generateCDSResponse(message, mode);
  }
  
  try {
    const systemPrompt = buildSystemPrompt(user, mode);
    const userPrompt = `User message: "${message}"`;
    
    console.log(`🤖 Calling OpenAI GPT-4o-mini for ${userId}`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: mode === 'strict' ? 0.3 : mode === 'balanced' ? 0.5 : 0.7,
      timeout: 8000
    });
    
    const response = completion.choices[0].message.content;
    
    // Increment usage
    user.features.chatCallsToday++;
    
    return {
      reply: response,
      source: 'openai_gpt4o_mini',
      hasVoice: true,
      voiceText: response.length <= 500 ? response : response.substring(0, 500) + '...'
    };
    
  } catch (error) {
    console.log(`❌ OpenAI error: ${error.message}, falling back to CDS`);
    return generateCDSResponse(message, mode);
  }
}

function buildSystemPrompt(user, mode) {
  const modeInstructions = {
    strict: "You are a STRICT drill sergeant. Be direct, commanding, and push for immediate action. Use military language.",
    balanced: "You are a balanced coach. Be supportive but firm, encouraging action while being understanding.",
    light: "You are a gentle guide. Be supportive, mindful, and encouraging. Use softer language."
  };
  
  return `You are "Drill Sergeant" - a habit coach in ${mode} mode. ${modeInstructions[mode]}

Keep responses under 200 characters. Be motivational and actionable.
User has ${user.stats?.longestStreak || 0} day max streak.`;
}

function generateCDSResponse(message, mode) {
  const responses = {
    strict: [
      "Stop making excuses! 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. MOVE!",
      "Your comfort zone is the enemy. Pick ONE habit. Commit. Execute. NOW!",
      "Quit whining and start grinding. What's the ONE thing you'll do right now?"
    ],
    balanced: [
      "Time to commit. What's the one habit that will move the needle today?",
      "Progress starts with action. Which habit deserves your attention right now?",
      "Let's focus your energy. One step at a time, you've got this."
    ],
    light: [
      "What feels right to focus on today? Trust your instincts.",
      "Which habit is calling to you right now? Listen to that inner voice.",
      "Take a breath. What would serve you best in this moment?"
    ]
  };
  
  const modeResponses = responses[mode] || responses.balanced;
  const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];
  
  return {
    reply: randomResponse,
    source: 'cds_fallback',
    hasVoice: true,
    voiceText: randomResponse
  };
}

// Enhanced Chat endpoint with voice
fastify.post('/v1/chat', {
  schema: {
    tags: ['Chat'],
    summary: 'Chat with AI Drill Sergeant (with voice)',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        mode: { type: 'string', enum: ['strict', 'balanced', 'light'], default: 'balanced' },
        includeVoice: { type: 'boolean', default: false }
      },
      required: ['message']
    }
  },
  preHandler: authenticate
}, async (request, reply) => {
  const { message, mode = 'balanced', includeVoice = false } = request.body;
  const userId = request.user.id;
  
  // Log chat interaction
  logEvent(userId, 'chat_interaction', { message, mode, includeVoice });
  
  // Generate AI response
  const aiResponse = await generateAIResponse(userId, message, mode, {});
  
  let voiceResponse = null;
  
  // Generate voice if requested and available
  if (includeVoice && aiResponse.hasVoice && users[userId].features.canUseDynamicTts) {
    try {
      const voiceId = config.VOICES[mode];
      const ttsResult = await generateElevenLabsTTS(aiResponse.voiceText || aiResponse.reply, voiceId, userId);
      voiceResponse = ttsResult;
    } catch (error) {
      console.log(`⚠️  Voice generation failed: ${error.message}`);
    }
  }
  
  return {
    reply: aiResponse.reply,
    source: aiResponse.source,
    voice: voiceResponse,
    usage: {
      chatCallsRemaining: Math.max(0, 50 - users[userId].features.chatCallsToday),
      canUseVoice: users[userId].features.canUseDynamicTts
    }
  };
});

// ============ OTHER CORE ENDPOINTS ============
fastify.get('/v1/users/me', {
  schema: { tags: ['Users'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  return users[request.user.id] || {};
});

fastify.get('/v1/habits', {
  schema: { tags: ['Habits'], security: [{ bearerAuth: [] }] },
  preHandler: authenticate
}, async (request, reply) => {
  const userHabits = habits.filter(h => h.userId === request.user.id);
  return userHabits.map(habit => ({
    ...habit,
    status: habit.lastTick && new Date(habit.lastTick).toDateString() === new Date().toDateString() 
      ? 'completed_today' : 'pending'
  }));
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
    
    // Check for achievements with voice
    const achievements = checkAchievements(request.user.id, habitId);
    
    console.log(`✅ "${habit.title}" ticked! Streak: ${previousStreak} → ${habit.streak}`);
    
    return {
      ok: true,
      streak: habit.streak,
      timestamp: habit.lastTick,
      achievements,
      hasVoiceCelebration: achievements.length > 0
    };
  }
  
  return {
    ok: true,
    streak: habit.streak,
    timestamp: habit.lastTick,
    idempotent: true,
    achievements: []
  };
});

function checkAchievements(userId, habitId) {
  const habit = habits.find(h => h.id === habitId && h.userId === userId);
  if (!habit) return [];
  
  const userAchievementsList = userAchievements.get(userId) || [];
  const newAchievements = [];
  
  // Check streak milestones
  const streakThresholds = [7, 30];
  for (const threshold of streakThresholds) {
    if (habit.streak === threshold) {
      const achievementKey = threshold === 7 ? 'first_week' : 'one_month';
      const achievement = ACHIEVEMENTS[achievementKey];
      
      if (achievement) {
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
          
          logEvent(userId, 'achievement_unlocked', {
            achievementId: achievement.id,
            habitId,
            habitTitle: habit.title,
            streak: habit.streak,
            hasVoice: true
          });
          
          console.log(`🎉 ACHIEVEMENT: ${achievement.title} for "${habit.title}"`);
        }
      }
    }
  }
  
  userAchievements.set(userId, userAchievementsList);
  return newAchievements;
}

// ============ INITIALIZATION ============
async function initializeVoiceSystem() {
  console.log('🎵 Initializing Voice & TTS System...');
  
  // Ensure voice cache directory exists
  try {
    await fs.mkdir(config.VOICE_CACHE_DIR, { recursive: true });
    console.log(`✅ Voice cache directory ready: ${config.VOICE_CACHE_DIR}`);
  } catch (error) {
    console.error(`❌ Failed to create voice cache directory: ${error.message}`);
  }
  
  // Initialize sample achievements
  const userId = 'demo-user-123';
  userAchievements.set(userId, []);
  
  console.log(`✅ Voice system initialized`);
  console.log(`   - ElevenLabs API: ${config.USE_REAL_ELEVENLABS ? 'ENABLED' : 'MOCK MODE'}`);
  console.log(`   - Voice cache: ${config.VOICE_CACHE_DIR}`);
  console.log(`   - Voices configured: ${Object.keys(config.VOICES).length}`);
}

// Daily quota reset
cron.schedule('0 0 * * *', () => {
  console.log('🔄 Resetting daily TTS quotas');
  
  Object.values(users).forEach(user => {
    user.features.chatCallsToday = 0;
    user.features.ttsCharsUsedToday = 0;
    user.features.lastQuotaReset = new Date().toISOString();
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    
    const spec = fastify.swagger();
    await fs.writeFile('./openapi.json', JSON.stringify(spec, null, 2));
    
    await initializeVoiceSystem();
    
    console.log('');
    console.log('🎯 ================================');
    console.log('🚀 DRILLSERGEANT API v6 (VOICE + TTS)');
    console.log('🎯 ================================');
    console.log('');
    console.log('📍 Server: http://localhost:8080');
    console.log('📚 API Docs: http://localhost:8080/docs');
    console.log('');
    console.log('✅ VOICE FEATURES:');
    console.log('   🎵 ElevenLabs TTS Integration');
    console.log('   🎤 Voice Presets with Real Audio');
    console.log('   �� Audio Caching System');
    console.log('   📊 Usage Quotas & Tracking');
    console.log('   🎭 3 Voice Personalities (Strict/Balanced/Light)');
    console.log('   🤖 AI Chat with Voice Responses');
    console.log('   🏆 Achievement Voice Celebrations');
    console.log('');
    console.log('🎮 READY FOR VOICE-ENABLED FLUTTER APP!');
    console.log('');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
