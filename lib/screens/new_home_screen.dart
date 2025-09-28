import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_client.dart';
import '../design/feedback.dart';
import '../audio/tts_provider.dart';

class NewHomeScreen extends StatefulWidget {
  final String? refreshTrigger;
  
  const NewHomeScreen({super.key, this.refreshTrigger});

  @override
  State<NewHomeScreen> createState() => _NewHomeScreenState();
}

class _NewHomeScreenState extends State<NewHomeScreen> with TickerProviderStateMixin {
  final tts = TtsProvider();
  // Core data
  Map<String, dynamic> briefData = {};
  List<dynamic> todayItems = [];
  bool isLoading = true;
  String? lastRefreshTrigger;
  Map<String, dynamic>? currentNudge;
  
  // Nudge voice autoplay dedupe
  String? _lastNudgeVoiceHash;
  DateTime? _lastNudgePlayedAt;
  
  // UI state
  DateTime selectedDate = DateTime.now();
  late AnimationController _progressController;
  
  // Color options matching React design
  final List<Map<String, dynamic>> colorOptions = [
    {'name': 'emerald', 'color': const Color(0xFF10B981), 'neon': const Color(0xFF34D399)},
    {'name': 'amber', 'color': const Color(0xFFF59E0B), 'neon': const Color(0xFFFBBF24)},
    {'name': 'sky', 'color': const Color(0xFF0EA5E9), 'neon': const Color(0xFF38BDF8)},
    {'name': 'rose', 'color': const Color(0xFFE11D48), 'neon': const Color(0xFFF43F5E)},
    {'name': 'violet', 'color': const Color(0xFF8B5CF6), 'neon': const Color(0xFFA78BFA)},
    {'name': 'slate', 'color': const Color(0xFF64748B), 'neon': const Color(0xFF94A3B8)},
  ];

  // Date helpers
  String formatDate(DateTime date) => date.toIso8601String().split('T')[0];
  
  List<DateTime> get weekDates {
    final startOfWeek = selectedDate.subtract(Duration(days: selectedDate.weekday % 7));
    return List.generate(7, (index) => startOfWeek.add(Duration(days: index)));
  }

  Color _getColorForItem(dynamic item) {
    final colorName = item['color'] ?? 'emerald';
    return colorOptions.firstWhere(
      (c) => c['name'] == colorName,
      orElse: () => colorOptions[0],
    )['color'];
  }

  Color _getNeonColorForItem(dynamic item) {
    final colorName = item['color'] ?? 'emerald';
    return colorOptions.firstWhere(
      (c) => c['name'] == colorName,
      orElse: () => colorOptions[0],
    )['neon'];
  }


  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    lastRefreshTrigger = widget.refreshTrigger;
    _loadData();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(NewHomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTrigger != null && widget.refreshTrigger != lastRefreshTrigger) {
      lastRefreshTrigger = widget.refreshTrigger;
      _loadData();
    }
  }

  // Helper function to check if habit was completed today
  bool _isCompletedToday(String? lastTick) {
    if (lastTick == null) return false;
    try {
      final tickDate = DateTime.parse(lastTick).toUtc();
      final todayUtc = DateTime.now().toUtc();
      return tickDate.year == todayUtc.year &&
          tickDate.month == todayUtc.month &&
          tickDate.day == todayUtc.day;
    } catch (e) {
      return false;
    }
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    try {
      apiClient.setAuthToken('valid-token');
      
      // Load today's brief using existing endpoint
      final briefResult = await apiClient.getBriefToday();
      
      // Load AI nudge if available
      Map<String, dynamic>? nudgeResult;
      try {
        nudgeResult = await apiClient.getNudge();
      } catch (e) {
        print('⚠️ No nudge available: $e');
      }
      
      print('📋 Brief loaded: ${briefResult.keys}');
      print('📋 Today items count: ${(briefResult['today'] as List?)?.length ?? 0}');
      print('📋 Raw today data: ${briefResult['today']}');
      
      // ENHANCED: Load habits and tasks from new backend response
      List<dynamic> today = briefResult['today'] ?? [];
      
      // If today is empty, build from habits and tasks
      if (today.isEmpty) {
        final habits = briefResult['habits'] as List? ?? [];
        final tasks = briefResult['tasks'] as List? ?? [];
        
        print('📋 Building today from ${habits.length} habits and ${tasks.length} tasks');
        
        // Add habits to today
        today.addAll(habits.map((habit) => {
          'id': habit['id'],
          'name': habit['title'] ?? habit['name'],
          'type': 'habit',
          'completed': _isCompletedToday(habit['lastTick']),
          'streak': habit['streak'] ?? 0,
          'color': habit['color'] ?? 'emerald',
          'reminderEnabled': habit['reminderEnabled'] ?? false,
          'reminderTime': habit['reminderTime'],
        }));
        
        // Add tasks to today
        today.addAll(tasks.map((task) => {
          'id': task['id'],
          'name': task['title'] ?? task['name'],
          'type': 'task',
          'completed': task['status'] == 'completed' || task['completed'] == true,
          'dueDate': task['dueDate'],
          'overdue': task['overdue'] ?? false,
          'priority': task['priority'] ?? 'medium',
          'color': task['color'] ?? 'amber',
          'reminderEnabled': task['reminderEnabled'] ?? false,
          'reminderTime': task['reminderTime'],
        }));
        
        print('📋 Today items built: ${today.length} total');
      }
      
      setState(() {
        briefData = briefResult;
        todayItems = today;
        currentNudge = nudgeResult;
        isLoading = false;
      });
      
      // Autoplay nudge voice once per new nudge
      _maybeAutoplayNudgeVoice();

      // Sync reminders to alarms (best-effort)
      _syncRemindersToAlarms();
      
      _progressController.forward();
    } catch (e) {
      print('❌ Error loading data: $e');
      setState(() => isLoading = false);
    }
  }

  void _maybeAutoplayNudgeVoice() async {
    try {
      final voice = currentNudge != null ? currentNudge!['voice'] : null;
      final url = (voice != null ? voice['url'] : null)?.toString() ?? '';
      if (url.isEmpty) return;

      final hash = url; // URL is unique per TTS
      final now = DateTime.now();
      // Debounce within 10s, and skip if same hash
      if (_lastNudgeVoiceHash == hash && _lastNudgePlayedAt != null && now.difference(_lastNudgePlayedAt!).inSeconds < 10) {
        return;
      }
      _lastNudgeVoiceHash = hash;
      _lastNudgePlayedAt = now;
      await tts.playFromUrl(url);
    } catch (_) {}
  }

  Future<void> _syncRemindersToAlarms() async {
    try {
      // Fetch existing alarms to avoid duplicates by label
      List<dynamic> existing = [];
      try {
        existing = await apiClient.getAlarms();
      } catch (e) {
        // If backend lacks alarms API, just return silently
        print('Alarms API not available or failed: $e');
        return;
      }
      final existingLabels = existing.map((a) => (a['label'] ?? '').toString()).toSet();

      for (final item in todayItems) {
        final hasReminder = item['reminderEnabled'] == true;
        final time = (item['reminderTime'] ?? '').toString();
        final name = (item['name'] ?? item['title'] ?? 'Reminder').toString();
        if (!hasReminder || time.isEmpty) continue;
        if (existingLabels.contains(name)) continue; // naive dedupe by label

        // Parse HH:mm
        final parts = time.split(':');
        if (parts.length < 2) continue;
        final hour = int.tryParse(parts[0]);
        final minute = int.tryParse(parts[1]);
        if (hour == null || minute == null) continue;

        final rrule = 'FREQ=DAILY;BYHOUR=$hour;BYMINUTE=$minute;BYSECOND=0';
        try {
          await apiClient.createAlarm({
            'label': name,
            'rrule': rrule,
            'tone': 'balanced',
          });
          print('📅 Alarm created for "$name" at $time');
        } catch (e) {
          print('Failed creating alarm for $name: $e');
        }
      }
    } catch (e) {
      print('Reminder sync error: $e');
    }
  }

  Future<void> _toggleCompletion(String itemId, String itemType, DateTime date) async {
    final dateStr = formatDate(date);
    try {
      // Use existing API endpoints
      if (itemType == 'habit') {
        await apiClient.tickHabit(itemId, idempotencyKey: '${itemId}_$dateStr');
      } else if (itemType == 'task') {
        await apiClient.completeTask(itemId);
      }
      // Refresh data to get updated state
      _loadData();
      HapticFeedback.selectionClick();
    } catch (e) {
      print('❌ Error toggling completion: $e');
    }
  }

  Widget _buildWeekStrip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Month/Year header with arrows
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: () => setState(() {
                  selectedDate = selectedDate.subtract(const Duration(days: 7));
                }),
                icon: const Icon(Icons.chevron_left, color: Colors.white),
              ),
              Text(
                '${_monthName(selectedDate.month)} ${selectedDate.year}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              IconButton(
                onPressed: () => setState(() {
                  selectedDate = selectedDate.add(const Duration(days: 7));
                }),
                icon: const Icon(Icons.chevron_right, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Week day buttons
          Row(
            children: weekDates.map((date) {
              final isSelected = formatDate(date) == formatDate(selectedDate);
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => selectedDate = date),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF10B981) : const Color(0xFF121816),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF34D399) : Colors.white.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _dayAbbr(date.weekday),
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${date.day}',
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    final user = briefData['user'] ?? {};
    final streaksSummary = briefData['streaksSummary'] ?? {};
    final xp = user['totalXP'] ?? 0;
    final level = user['level'] ?? 1;
    final rank = user['rank'] ?? 'Sergeant';
    final streak = streaksSummary['currentStreak'] ?? 0;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F201A), Color(0xFF12251E), Color(0xFF0F201A)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Rank: $rank',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Level $level • Streak $streak days',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                // Progress bar
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) {
                        return LinearProgressIndicator(
                          value: _progressController.value * 0.65, // Sample progress
                          backgroundColor: Colors.transparent,
                          valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$xp XP',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.local_fire_department, color: Color(0xFFF59E0B), size: 16),
                    SizedBox(width: 4),
                    Text(
                      'Top 15% consistency',
                      style: TextStyle(
                        color: Color(0xFFF59E0B),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFocusCards() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Today's Focus
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF121816),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Today\'s Focus',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.emoji_events, color: Color(0xFF10B981), size: 20),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF10B981).withOpacity(0.2),
                        const Color(0xFF34D399).withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Start with the highest-intensity mission for ${_dayName(selectedDate.weekday)}.',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // Today's Missions
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF121816),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFF59E0B).withOpacity(0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Today\'s Missions',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.check_box, color: Color(0xFFF59E0B), size: 20),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFF59E0B).withOpacity(0.2),
                        const Color(0xFFFBBF24).withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getMissionSummary(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getMissionSummary() {
    final completed = todayItems.where((item) => item['completed'] == true).length;
    if (completed == 0 && todayItems.isEmpty) {
      return 'No missions for today 🎉';
    }
    return '$completed / ${todayItems.length} complete';
  }

  Widget _buildTodayItems() {
    if (todayItems.isEmpty) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF121816),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: const Center(
          child: Text(
            'No habits or tasks for today. Create one in the Habits tab!',
            style: TextStyle(color: Colors.white70, fontSize: 16),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Today's Missions",
            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ...todayItems.map((item) => _buildTodayItemCard(item)),
        ],
      ),
    );
  }

  Widget _buildTodayItemCard(Map<String, dynamic> item) {
    final isCompleted = item['completed'] == true;
    final itemName = (item['name'] ?? item['title'] ?? 'Item').toString();
    final itemType = (item['type'] ?? 'habit').toString();
    final itemColor = _getColorForItem(item);
    final neonColor = _getNeonColorForItem(item);

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: 1,
      child: InkWell(
        onTap: () async {
          try {
            // Optimistic UI update
            setState(() {
              final idx = todayItems.indexWhere((it) => (it['id']?.toString() ?? '') == (item['id']?.toString() ?? ''));
              if (idx >= 0) todayItems[idx]['completed'] = true;
            });
            HapticFeedback.selectionClick();
            await _toggleCompletion(item['id'].toString(), itemType, selectedDate);
            Toast.show(context, '${itemType == 'task' ? 'Task' : 'Habit'} completed');
          } catch (e) {
            Toast.show(context, 'Failed to complete: $e');
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                itemColor.withOpacity(0.2),
                itemColor.withOpacity(0.1),
                const Color(0xFF121816),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: neonColor.withOpacity(0.6), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: neonColor.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isCompleted ? neonColor : itemColor,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: (isCompleted ? neonColor : itemColor).withOpacity(0.4),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  isCompleted ? Icons.check : Icons.local_fire_department,
                  color: Colors.black,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      itemName,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        decoration: isCompleted ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      itemType == 'task' ? 'Tap to complete task' : 'Tap to tick today',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white54),
            ],
          ),
        ),
      ),
    );
  }

  String _monthName(int month) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  String _dayAbbr(int weekday) {
    const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday];
  }

  String _dayName(int weekday) {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday];
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading && briefData.isEmpty) {
      return const Scaffold(
        backgroundColor: Color(0xFF0B0F0E),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF10B981)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F0E),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            // Top bar
            SliverAppBar(
              backgroundColor: const Color(0xFF0B0F0E),
              elevation: 0,
              floating: true,
              title: Row(
                children: [
                  const Icon(Icons.auto_awesome, color: Color(0xFF10B981), size: 24),
                  const SizedBox(width: 8),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFFF59E0B)],
                    ).createShader(bounds),
                    child: const Text(
                      'Daily Orders',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  onPressed: () => Toast.show(context, 'Settings coming soon'),
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.settings, color: Colors.white, size: 20),
                  ),
                ),
                const SizedBox(width: 16),
              ],
            ),
            
            // Content
            SliverList(
              delegate: SliverChildListDelegate([
                _buildWeekStrip(),
                const SizedBox(height: 24),
                _buildHeroSection(),
                const SizedBox(height: 24),
                _buildFocusCards(),
                const SizedBox(height: 16),
                _buildTodayItems(),
                const SizedBox(height: 120), // Bottom padding for nav
              ]),
            ),
          ],
        ),
      ),
    );
  }
} 