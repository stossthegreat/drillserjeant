import 'package:flutter/material.dart';
import '../services/api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool isLoading = true;
  Map<String, dynamic>? briefData;
  List<dynamic> habitsPreview = [];

  @override
  void initState() {
    super.initState();
    _loadBrief();
  }

  void _loadBrief() async {
    setState(() { isLoading = true; });
    
    try {
      apiClient.setAuthToken('valid-token');
      final brief = await apiClient.getBriefToday();
      final habits = await apiClient.getHabits();
      
      setState(() {
        briefData = brief;
        habitsPreview = (habits as List).take(6).toList();
        isLoading = false;
      });
      
    } catch (e) {
      print('Failed to load brief: $e');
      setState(() { isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading && briefData == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final user = briefData?['user'] ?? {};
    final missions = briefData?['missions'] ?? [];
    final riskBanners = briefData?['riskBanners'] ?? [];
    final weeklyTarget = briefData?['weeklyTarget'] ?? {};
    final streaksSummary = briefData?['streaksSummary'] ?? {};
    final nudges = briefData?['nudges'] ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      body: RefreshIndicator(
        onRefresh: () async => _loadBrief(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SizedBox(height: 40),
            
            // Header with Rank and XP
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2D1B69), Color(0xFF11998E)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rank: ${user['rank'] ?? 'Sergeant'}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Level ${user['level'] ?? 1}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${user['xp'] ?? 0} XP',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Overall Streak: ${streaksSummary['overall'] ?? 0} days',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Risk Banners
            if (riskBanners.isNotEmpty) ...[
              for (var banner in riskBanners)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          banner['message'] ?? '',
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            
            // Weekly Target
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF2A2A2A),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Weekly Target',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: LinearProgressIndicator(
                          value: (weeklyTarget['current'] ?? 0) / (weeklyTarget['goal'] ?? 1),
                          backgroundColor: Colors.grey.withOpacity(0.3),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF11998E)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${weeklyTarget['current'] ?? 0}/${weeklyTarget['goal'] ?? 0}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Missions
            const Text(
              'Today\'s Missions',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            if (missions.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'No missions for today! 🎉',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                  ),
                ),
              )
            else
              for (var mission in missions)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: mission['status'] == 'completed' 
                        ? Colors.green.withOpacity(0.3)
                        : Colors.blue.withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              mission['title'] ?? '',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: mission['status'] == 'completed' 
                                ? Colors.green.withOpacity(0.2)
                                : Colors.blue.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              mission['status'] ?? 'pending',
                              style: TextStyle(
                                color: mission['status'] == 'completed' 
                                  ? Colors.green
                                  : Colors.blue,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.local_fire_department, color: Colors.orange, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            '${mission['streak'] ?? 0} day streak',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            'Next milestone: ${mission['nextMilestone'] ?? 0} days',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            
            const SizedBox(height: 24),
            
            // Streaks Summary
            if (streaksSummary['categories'] != null && (streaksSummary['categories'] as List).isNotEmpty) ...[
              const Text(
                'Streak Categories',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              for (var category in streaksSummary['categories'])
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          category['name'] ?? '',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Text(
                        '${category['days'] ?? 0} days',
                        style: const TextStyle(
                          color: Colors.orange,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            
            const SizedBox(height: 24),
            
            // Nudges
            if (nudges.isNotEmpty) ...[
              const Text(
                'Nudges',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              for (var nudge in nudges)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: nudge['priority'] == 'high' 
                      ? Colors.orange.withOpacity(0.1)
                      : Colors.blue.withOpacity(0.1),
                    border: Border.all(
                      color: nudge['priority'] == 'high' 
                        ? Colors.orange.withOpacity(0.3)
                        : Colors.blue.withOpacity(0.3),
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        nudge['title'] ?? '',
                        style: TextStyle(
                          color: nudge['priority'] == 'high' ? Colors.orange : Colors.blue,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        nudge['message'] ?? '',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            
            const SizedBox(height: 24),
            
            // Habits preview
            if (habitsPreview.isNotEmpty) ...[
              const Text(
                'Your Habits',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...habitsPreview.map((h) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.greenAccent.withOpacity(0.8), size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      (h['title'] ?? h['name'] ?? 'Habit').toString(),
                      style: const TextStyle(color: Colors.white),
                    )),
                    Text('Streak ${h['streak'] ?? 0}', style: const TextStyle(color: Colors.white70)),
                  ],
                ),
              )),
            ],
            
            const SizedBox(height: 100), // Bottom padding
          ],
        ),
      ),
    );
  }
}
