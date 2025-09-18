# BACKEND GAP REPORT
## Pre-Flight Audit: Flutter Frontend → Backend API Mapping

Generated: 2025-09-16 23:05 UTC

### Executive Summary
- **Frontend Screens Analyzed**: 10 screens
- **Required Endpoints**: 31 endpoints
- **Currently Implemented**: 3 endpoints (10%)
- **Missing Critical**: 28 endpoints (90%)

---

## Screen-by-Screen Analysis

### 1. Home Screen (`lib/screens/home_screen.dart`)
**Purpose**: Dashboard with rank, weekly ops, battle timer, missions, interceptions

**Required Endpoints**:
- ❌ `GET /v1/brief/today` - Daily missions, weekly target, risk banners
- ❌ `GET /v1/users/me` - User rank, streak freeze tokens
- ❌ `POST /v1/chat` - Quick drill sergeant interactions
- ❌ `GET /v1/dialogue/serve?intent=morning_brief` - Morning briefing text
- ❌ `GET /v1/voice/preset/:id` - Audio for briefings
- ❌ `POST /v1/voice/tts` - Dynamic TTS for custom messages

**Current Status**: Uses hardcoded mock data, no API calls

---

### 2. Habits Screen (`lib/screens/habits_screen.dart`) 
**Purpose**: Daily habits and anti-habits management with toggle

**Required Endpoints**:
- ❌ `GET /v1/habits` - List user's habits
- ❌ `POST /v1/habits` - Create new habit
- ❌ `PATCH /v1/habits/:id` - Update habit
- ❌ `POST /v1/habits/:id/tick` - Mark habit complete (idempotent)
- ❌ `GET /v1/antihabits` - List user's anti-habits
- ❌ `POST /v1/antihabits` - Create new anti-habit
- ❌ `PATCH /v1/antihabits/:id` - Update anti-habit
- ❌ `POST /v1/antihabits/:id/slip` - Record anti-habit slip (idempotent)

**Current Status**: Uses local state arrays, no persistence

---

### 3. Habit Detail Screen (`lib/screens/habit_detail_screen.dart`)
**Purpose**: Individual habit management with schedule, tags, heatmap

**Required Endpoints**:
- ❌ `GET /v1/habits/:id` - Detailed habit data
- ❌ `PATCH /v1/habits/:id` - Update schedule, tags, settings
- ❌ `GET /v1/habits/:id/history` - Completion heatmap data
- ❌ `GET /v1/habits/:id/blockers` - Current blockers
- ❌ `POST /v1/habits/:id/blockers` - Add blocker

**Current Status**: Placeholder screen with no functionality

---

### 4. Anti-Habit Detail Screen (`lib/screens/anti_habit_detail_screen.dart`)
**Purpose**: Anti-habit management with danger windows, interception

**Required Endpoints**:
- ❌ `GET /v1/antihabits/:id` - Detailed anti-habit data
- ❌ `PATCH /v1/antihabits/:id` - Update target minutes, danger windows
- ❌ `GET /v1/antihabits/:id/apps` - Flagged apps list (Android)
- ❌ `POST /v1/antihabits/:id/interception` - Test interception

**Current Status**: Placeholder screen with no functionality

---

### 5. Chat Screen (`lib/screens/chat_screen.dart`)
**Purpose**: AI Drill Sergeant conversation interface

**Required Endpoints**:
- ❌ `POST /v1/chat` - Send message, get AI response with actions
- ❌ `GET /v1/dialogue/serve` - Get preset responses by intent
- ❌ `POST /v1/voice/tts` - Convert responses to speech
- ❌ `GET /v1/voice/preset/:id` - Play preset audio responses

**Current Status**: Uses hardcoded response logic, no AI integration

---

### 6. Streaks Screen (`lib/screens/streaks_screen.dart`)
**Purpose**: Gamified streaks with achievements, weekly targets

**Required Endpoints**:
- ❌ `GET /v1/brief/today` - Streak summary, weekly target, achievements
- ❌ `GET /v1/habits` - Individual habit streaks
- ❌ `GET /v1/antihabits` - Anti-habit clean streaks
- ❌ `GET /v1/dialogue/serve?intent=praise_rankup` - Achievement praise
- ❌ `GET /v1/voice/preset/:id` - Achievement audio rewards

**Current Status**: Uses mock data with hardcoded achievements

---

### 7. Settings Screen (`lib/screens/settings_screen.dart`)
**Purpose**: User preferences, account management, data export

**Required Endpoints**:
- ❌ `GET /v1/users/me` - User profile and settings
- ❌ `PATCH /v1/users/me` - Update tone mode, intensity, consent, safe word
- ❌ `GET /v1/policies/current` - Privacy policy, terms
- ❌ `POST /v1/account/export` - Generate data export ZIP
- ❌ `POST /v1/account/delete` - Delete account and data
- ❌ `POST /v1/billing/checkout` - Upgrade to Pro
- ❌ `POST /v1/billing/portal` - Manage subscription

**Current Status**: Local state only, no persistence or billing

---

### 8. Alarms Screen (`lib/screens/alarms_screen.dart`)
**Purpose**: Alarm management and scheduling

**Required Endpoints**:
- ❌ `GET /v1/alarms` - List user's alarms
- ❌ `POST /v1/alarms` - Create alarm with RRULE
- ❌ `PATCH /v1/alarms/:id` - Update alarm
- ❌ `DELETE /v1/alarms/:id` - Delete alarm
- ❌ `POST /v1/jobs/schedule-alarm` - Test alarm firing

**Current Status**: Placeholder screen with no functionality

---

### 9. Onboarding Screen (`lib/screens/onboarding_screen.dart`)
**Purpose**: User registration and initial setup

**Required Endpoints**:
- ❌ `POST /v1/auth/verifyToken` - Firebase token verification
- ❌ `POST /v1/users` - Create user profile
- ❌ `PATCH /v1/users/me` - Set initial preferences

**Current Status**: Placeholder screen

---

### 10. Design Gallery (`lib/screens/design_gallery.dart`)
**Purpose**: Component showcase (development only)

**Required Endpoints**: None (UI components only)
**Current Status**: ✅ Complete

---

## Critical Backend Components Status

### Authentication & Users
- ❌ Firebase Auth integration
- ❌ User profile management
- ❌ Settings persistence

### Habits & Anti-Habits
- ❌ CRUD operations
- ❌ Tick/slip tracking with idempotency
- ❌ Streak calculations
- ❌ History and analytics

### AI & Chat
- ❌ OpenAI GPT-4o-mini integration
- ❌ Structured JSON responses
- ❌ Chat history and context

### Voice & Audio
- ❌ ElevenLabs TTS integration
- ❌ Preset audio management
- ❌ Voice caching system

### Rules Engine
- ❌ Deterministic rule evaluation
- ❌ Trigger system (hourly + events)
- ❌ Action generation

### Notifications & Alarms
- ❌ RRULE parsing and scheduling
- ❌ BullMQ job processing
- ❌ Push notification system

### Data & Analytics
- ❌ Event logging system
- ❌ Memory and embeddings (pgvector)
- ❌ User facts computation

### Billing & Subscriptions
- ❌ Stripe integration
- ❌ Plan management
- ❌ Usage quotas and limits

---

## Implementation Priority

### P0 - Core AI Loop (Required for MVP)
1. User authentication and profile management
2. Chat system with OpenAI integration
3. Basic habits CRUD with tick/slip
4. Brief/today endpoint for dashboard
5. Voice TTS with preset fallbacks

### P1 - Essential Features
1. Alarms with scheduling
2. Streaks and achievements
3. Rules engine for nudges
4. Settings persistence
5. Data export

### P2 - Advanced Features
1. Billing and subscriptions
2. Memory and embeddings
3. Advanced analytics
4. Admin tools

---

## Technical Debt & Risks

### High Risk
- **No authentication**: Frontend has no user sessions
- **No data persistence**: All data is ephemeral
- **No API client**: Frontend needs generated API client
- **No error handling**: No network error recovery

### Medium Risk
- **Hardcoded responses**: Chat uses static logic vs AI
- **Mock achievements**: Streak system not connected to real data
- **No offline support**: App breaks without network

### Low Risk
- **Missing animations**: Some UI polish incomplete
- **Test coverage**: Need more comprehensive testing

---

## Fix Plan

### Phase 1: Foundation (Days 1-2)
1. Set up complete NestJS backend structure
2. Implement Prisma schema and migrations
3. Add Firebase Auth integration
4. Create basic CRUD endpoints for users/habits

### Phase 2: AI Integration (Days 3-4)
1. Implement OpenAI chat system
2. Add ElevenLabs TTS with caching
3. Build dialogue/preset system
4. Create brief/today aggregation

### Phase 3: Advanced Features (Days 5-6)
1. Implement alarms with BullMQ
2. Add rules engine and triggers
3. Build achievements system
4. Add billing integration

### Phase 4: Polish & Testing (Day 7)
1. Generate OpenAPI spec and Flutter client
2. Add comprehensive error handling
3. Implement data export/delete
4. Complete smoke test requirements

---

## Success Criteria

✅ **Definition of Done**:
- All 28 missing endpoints implemented
- Flutter app works with real backend data
- 60-second smoke test passes
- OpenAPI spec generated
- Docker compose setup working
- User can complete full flow: register → add habits → chat → upgrade → export

**Estimated Implementation Time**: 7 days
**Current Completion**: 10% (infrastructure only)
**Remaining Work**: 90% (all core functionality)

---

*Next Step: Begin Phase 1 implementation starting with backend foundation and authentication.* 