import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'design/theme.dart';
import 'screens/home_screen.dart';
import 'screens/habits_screen.dart';
import 'screens/streaks_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/alarms_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/design_gallery.dart';
import 'widgets/root_shell.dart';
import 'screens/onboarding_screen.dart';
import 'screens/habit_detail_screen.dart';
import 'screens/anti_habit_detail_screen.dart';
import 'services/api_client.dart';

void main() {
  apiClient.setBaseUrl('https://drillsergeantai-production.up.railway.app');
  runApp(const DrillSergeantApp());
}

class DrillSergeantApp extends StatelessWidget {
  const DrillSergeantApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        GoRoute(path: '/design', builder: (c, s) => const DesignGallery()),
        GoRoute(path: '/onboarding', builder: (c, s) => const OnboardingScreen()),
        ShellRoute(
          builder: (context, state, child) => RootShell(child: child),
          routes: [
            GoRoute(path: '/home', builder: (c, s) => const HomeScreen()),
            GoRoute(path: '/habits', builder: (c, s) => const HabitsScreen()),
            GoRoute(path: '/habits/:id', builder: (c, s) => HabitDetailScreen(id: s.pathParameters['id'] ?? 'id')),
            GoRoute(path: '/antihabits/:id', builder: (c, s) => AntiHabitDetailScreen(id: s.pathParameters['id'] ?? 'id')),
            GoRoute(path: '/streaks', builder: (c, s) => const StreaksScreen()),
            GoRoute(path: '/chat', builder: (c, s) => const ChatScreen()),
            GoRoute(path: '/alarms', builder: (c, s) => const AlarmsScreen()),
            GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),
          ],
        ),
      ],
    );

    return MaterialApp.router(
      title: 'DrillSergeantX',
      debugShowCheckedModeBanner: false,
      theme: buildDarkTheme(),
      routerConfig: router,
    );
  }
}
