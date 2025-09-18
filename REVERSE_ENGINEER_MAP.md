# REVERSE_ENGINEER_MAP

This document maps the provided single-file React prototype to a one-to-one Flutter implementation, noting screens, components, props/state, animations, and assets. It guides Phase 1 (UI kit) and Phase 2 (screens) for pixel/flow parity.

## Screens / Tabs (React -> Flutter)
- Home (`HomePanel`, `MissionsPanel`, `TimerPanel`) -> `HomeScreen`
- Habits (`HabitsPanel`) -> `HabitsScreen` with in-page toggle: Habits | Anti-Habits
- Streaks (`StreaksPanel`) -> `StreaksScreen`
- Sergeant/Chat (`SergeantChatPanel`) -> `ChatScreen`
- Settings (`SettingsPanel`) -> `SettingsScreen`

Routing (Flutter): `go_router` with routes: `/home`, `/habits`, `/streaks`, `/chat`, `/settings`, plus `/design` for UI kit gallery, `/alarms` for future alarm takeover.

## Shared UI & Effects
- Animated gradient background orbs -> `GlassCard` + subtle blurred glass surfaces; optional decorative orbs in `DesignGallery`.
- Motion: Framer Motion fade/slide -> Flutter `AnimatedSwitcher`/`AnimatedOpacity`/`SlideTransition` (200ms ease) and springs for large transitions.
- Icons: `lucide-react` -> substitute Material/Cupertino or cust. assets; maintain size/weight.
- Voice (Web Speech API) -> ElevenLabs adapter (`tts_provider.dart`) with cached presets + dynamic fallback.
- Haptics/vibration -> `sfx.dart` thin wrapper; guarded by platform checks.

## State/Storage
- localStorage (habits/xp/tokens/history/etc.) -> Flutter local mock (Phase 2) then Isar/SharedPreferences; server sync in Phase 3.
- Derived values: rank, streaks, daily missions -> mirrored in `mock_data.dart` utilities, then repos.

## React Components -> Flutter Widgets
- `BgOrbs` -> decorative layer in `DesignGallery` (optional on screens)
- `TabWrapper` (fade/slide) -> `AnimatedSwitcher` wrapper per route/screen
- `NavBtn` -> bottom nav bar buttons; Flutter `NavigationBar` or custom `GlassButton`
- `ToneBadge` -> `TogglePills` or `ChoiceChip`-like
- `ProgressBar` -> `LinearProgressIndicator` styled or custom
- `HomePanel` -> composed of `GlassCard`s, `RingProgress`, badges
- `MissionsPanel` -> list of `MissionCard`
- `TimerPanel` -> `GlassCard` with time, mode, start/pause/reset buttons
- `HabitsPanel` -> list with add/edit modal, move up/down, freeze, delete
- `StreaksPanel` -> `FlameBadge`, milestone chips, claim buttons
- `SergeantChatPanel` -> chat bubbles, quick chips, send form
- `SettingsPanel` -> backup/import, tokens adjust, danger zone

## Data Models (Phase 2 mock)
- Habit: `{id, name, streak, completed, difficulty}`
- AntiHabit: `{id, name, cleanStreak, targetMinutes, dangerWindows: List<int>, flaggedApps: List<String>, interceptionEnabled: bool}`
- WeeklyOp, Rank, Tokens, Tone, TTS, History -> simple stores in mock

## Anti-Habits (New UX in Habits page)
- Top pills: [Habits | Anti-Habits]
- Anti-Habits list cells: name, clean-streak days, target (≤ mins/day), small heatmap (7d), interception toggle
- Add Anti-Habit modal: name, target mins/day, danger window chips (hours), flagged apps (Android), interception toggle, preview bark
- Detail screen: full edit of fields + bark preview

## Visual System (Flutter UI Kit)
- `design/tokens.dart`: colors (#0B0F14 base, glass rgba(255,255,255,0.06), borders rgba(255,255,255,0.12), accent #7CFFB2, warn #FFB84D, danger #FF5E5E), radius (12/20/28), blur (10/18), motion (180–220ms), shadows
- `design/glass.dart`: `GlassCard`, `GlassButton.primary/ghost/danger`
- `design/charts/ring_progress.dart`: circular progress
- `badges/flame_badge.dart`, `badges/rank_ribbon.dart`
- `inputs/toggle_pills.dart`
- `widgets/mission_card.dart`, `widgets/interception_card.dart`, `widgets/alarm_takeover.dart`, `widgets/empty_state.dart`

## Gaps / Assumptions
- Precise fonts not defined; use GoogleFonts Inter as default.
- Exact lucide icons: approximate with Material Icons unless assets provided.
- Timer exact TTS/haptics mapped to ElevenLabs preset stubs.
- Storage: Phase 2 uses in-memory mock; persistence added in later pass.

## Acceptance Targets (Phase 1 & 2)
- `/design` route demonstrates all reusable widgets.
- `/habits` includes pill toggle for Anti-Habits, add/edit modal, interception toggle.
- Visual parity: colors, radii, spacing, and glass feel aligned with React prototype. 