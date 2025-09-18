import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../design/glass.dart';
import '../design/tokens.dart';
import '../inputs/toggle_pills.dart';
import '../design/charts/heatmap.dart';
import "../design/feedback.dart";
import "../services/api_client.dart";

class HabitItem {
  String id;
  String name;
  int streak;
  bool completed;
  int difficulty; // 1-3
  HabitItem({required this.id, required this.name, this.streak = 0, this.completed = false, this.difficulty = 2});
}

class AntiHabitItem {
  String id;
  String name;
  int cleanStreak; // days since last slip
  int targetMinutes;
  bool interceptionEnabled;
  Set<int> dangerHours; // 0-23
  AntiHabitItem({required this.id, required this.name, this.cleanStreak = 0, this.targetMinutes = 10, this.interceptionEnabled = false, Set<int>? dangerHours}) : dangerHours = dangerHours ?? {};
}

class HabitsScreen extends StatefulWidget {
  const HabitsScreen({super.key});

  @override
  State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  bool loading = false;
  bool showAnti = false;
  List<HabitItem> habits = [];
  final List<AntiHabitItem> antiHabits = [
    AntiHabitItem(id: 'a1', name: 'No Social Media', cleanStreak: 2, targetMinutes: 15, interceptionEnabled: false, dangerHours: {20,21,22}),
  ];

  @override
  void initState() {
    super.initState();
    _loadHabits();
  }

  Future<void> _loadHabits() async {
    setState(() { loading = true; });
    try {
      apiClient.setAuthToken("valid-token");
      final list = await apiClient.getHabits();
      final today = DateTime.now().toIso8601String().split('T')[0];
      final mapped = (list as List).map((h) {
        final id = (h['id'] ?? '').toString();
        final title = (h['title'] ?? h['name'] ?? 'Habit').toString();
        final streak = (h['streak'] ?? 0) as int;
        final lastTick = (h['lastTick'] ?? '') as String;
        final completed = lastTick.startsWith(today);
        return HabitItem(id: id, name: title, streak: streak, completed: completed);
      }).toList();
      setState(() { habits = mapped; loading = false; });
    } catch (e) {
      setState(() { loading = false; });
      Toast.show(context, 'Failed to load habits: $e');
    }
  }

  void _tickHabit(HabitItem habit) async {
    try {
      apiClient.setAuthToken("valid-token");
      final idempotencyKey = "${habit.id}-${DateTime.now().toIso8601String().split("T")[0]}";
      final result = await apiClient.tickHabit(habit.id, idempotencyKey: idempotencyKey);
      setState(() {
        habit.completed = true;
        habit.streak += 1;
      });
      if (result.containsKey("achievements") && result["achievements"] != null) {
        final achievements = result["achievements"] as List;
        if (achievements.isNotEmpty) {
          _showAchievementCelebration(achievements);
        }
      }
      Toast.show(context, "✅ ${habit.name} completed! Streak: ${habit.streak}");
      try {
        await apiClient.getBriefToday();
      } catch (_) {}
      if (mounted) context.go('/home');
    } catch (e) {
      Toast.show(context, "Failed to complete habit: $e");
    }
  }

  Future<void> _createHabitAndGoHome(String name, int difficulty) async {
    try {
      apiClient.setAuthToken("valid-token");
      final created = await apiClient.createHabit({
        'title': name,
        'schedule': { 'type': 'daily' },
        'difficulty': difficulty,
      });
      final habit = HabitItem(
        id: (created['id'] ?? '').toString(),
        name: (created['title'] ?? name).toString(),
        difficulty: difficulty,
      );
      setState(() { habits.add(habit); });
      Toast.show(context, '✅ Habit created');
      if (mounted) context.go('/home');
    } catch (e) {
      Toast.show(context, 'Failed to create habit: $e');
    }
  }

  Future<void> _createTaskAndGoHome(String title) async {
    try {
      apiClient.setAuthToken("valid-token");
      final today = DateTime.now().toIso8601String().split('T')[0];
      final created = await apiClient.createHabit({
        'title': title,
        'type': 'task',
        'schedule': { 'type': 'one_off', 'date': today },
      });
      final task = HabitItem(
        id: (created['id'] ?? '').toString(),
        name: (created['title'] ?? title).toString(),
        difficulty: 1,
      );
      setState(() { habits.add(task); });
      Toast.show(context, '✅ Task added');
      if (mounted) context.go('/home');
    } catch (e) {
      Toast.show(context, 'Failed to add task: $e');
    }
  }

  void _showAchievementCelebration(List achievements) {
    for (var achievement in achievements) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text("🎉 Achievement Unlocked!"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(achievement["title"] ?? "New Achievement"),
              SizedBox(height: 8),
              Text(achievement["description"] ?? "Great job!"),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("Awesome!"),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Daily Orders')),
      body: loading
        ? const Center(child: CircularProgressIndicator())
        : ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TogglePills(
            labels: const ['Habits', 'Anti-Habits'],
            selectedIndex: showAnti ? 1 : 0,
            onChanged: (i) => setState(() => showAnti = i == 1),
          ),
          const SizedBox(height: 12),
          if (!showAnti) ...[
            _AddTask(onAddTask: (title) => _createTaskAndGoHome(title)),
            const SizedBox(height: 8),
            _AddHabit(onAdd: (name, diff) => _createHabitAndGoHome(name, diff)),
            const SizedBox(height: 12),
            ...habits.map((h) => _HabitTile(
              item: h,
              onToggle: () => _tickHabit(h),
              onDelete: () => setState(() => habits.remove(h)),
              onOpen: () => context.push('/habits/${h.id}'),
            )),
          ] else ...[
            GlassButton.primary('Add Anti-Habit', onPressed: () async {
              final res = await _showAddAntiHabitDialog(context);
              if (res != null) {
                setState(() => antiHabits.add(res));
              }
            }),
            const SizedBox(height: 12),
            ...antiHabits.map((a) => _AntiHabitTile(
              item: a,
              onToggleInterception: () => setState(() => a.interceptionEnabled = !a.interceptionEnabled),
              onDelete: () => setState(() => antiHabits.remove(a)),
              onEdit: () async {
                final res = await _showEditAntiHabitDialog(context, a);
                if (res != null) {
                  setState(() {
                    a.name = res.name;
                    a.targetMinutes = res.targetMinutes;
                    a.dangerHours = res.dangerHours;
                    a.interceptionEnabled = res.interceptionEnabled;
                  });
                }
              },
            )),
          ],
        ],
      ),
    );
  }
}

class _HabitTile extends StatelessWidget {
  final HabitItem item;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onOpen;
  const _HabitTile({required this.item, required this.onToggle, required this.onDelete, required this.onOpen});
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            IconButton(
              icon: Icon(item.completed ? Icons.check_box : Icons.check_box_outline_blank, color: item.completed ? Colors.greenAccent : DSXColors.textSecondary),
              onPressed: onToggle,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text('Streak: ${item.streak}  •  Difficulty: ${item.difficulty}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: DSXColors.textSecondary)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            IconButton(icon: const Icon(Icons.open_in_new, size: 20), onPressed: onOpen),
            IconButton(icon: const Icon(Icons.delete_outline, size: 20), onPressed: onDelete),
          ],
        ),
      ),
    );
  }
}

class _AntiHabitTile extends StatelessWidget {
  final AntiHabitItem item;
  final VoidCallback onToggleInterception;
  final VoidCallback onDelete;
  final Future<void> Function() onEdit;
  const _AntiHabitTile({required this.item, required this.onToggleInterception, required this.onDelete, required this.onEdit});
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(item.name, style: Theme.of(context).textTheme.titleMedium)),
                IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: onEdit),
                IconButton(icon: const Icon(Icons.delete_outline, size: 18), onPressed: onDelete),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(child: Text('Clean streak: ${item.cleanStreak} days', style: Theme.of(context).textTheme.bodySmall)),
                const SizedBox(width: 8),
                Row(
                  children: [
                    Switch(value: item.interceptionEnabled, onChanged: (_) => onToggleInterception()),
                    Text('Interception', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddTask extends StatefulWidget {
  final void Function(String title) onAddTask;
  const _AddTask({required this.onAddTask});
  @override
  State<_AddTask> createState() => _AddTaskState();
}

class _AddTaskState extends State<_AddTask> {
  final controller = TextEditingController();
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                decoration: const InputDecoration(hintText: 'Quick task for today', border: InputBorder.none),
              ),
            ),
            const SizedBox(width: 8),
            GlassButton.primary('Add Task', onPressed: () async {
              final title = controller.text.trim();
              if (title.isEmpty) return;
              await widget.onAddTask(title);
              controller.clear();
            }),
          ],
        ),
      ),
    );
  }
}

class _AddHabit extends StatefulWidget {
  final void Function(String name, int difficulty) onAdd;
  const _AddHabit({required this.onAdd});
  @override
  State<_AddHabit> createState() => _AddHabitState();
}

class _AddHabitState extends State<_AddHabit> {
  final controller = TextEditingController();
  int difficulty = 2;
  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: const InputDecoration(hintText: 'New habit name', border: InputBorder.none),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<int>(
                value: difficulty,
                underline: const SizedBox.shrink(),
                dropdownColor: Colors.black,
                items: const [
                  DropdownMenuItem(value: 1, child: Text('Easy')),
                  DropdownMenuItem(value: 2, child: Text('Medium')),
                  DropdownMenuItem(value: 3, child: Text('Hard')),
                ],
                onChanged: (v) => setState(() => difficulty = v ?? 2),
              ),
              const SizedBox(width: 8),
              GlassButton.primary('Add', onPressed: () async {
                final name = controller.text.trim();
                if (name.isEmpty) return;
                await widget.onAdd(name, difficulty);
                controller.clear();
                setState(() => difficulty = 2);
              }),
            ]),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label; final bool selected; final VoidCallback onTap;
  const _Pill({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? Colors.amber.withOpacity(0.15) : Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? Colors.amber.withOpacity(0.4) : DSXColors.border),
        ),
        alignment: Alignment.center,
        child: Text(label, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: selected ? Colors.amber : Colors.white)),
      ),
    );
  }
}

Future<(String,int)?> _showEditHabitDialog(BuildContext context, String name, int diff) async {
  final nameCtrl = TextEditingController(text: name);
  int difficulty = diff;
  return showDialog<(String,int)?>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Edit Habit'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: 'Name')),
          const SizedBox(height: 8),
          DropdownButton<int>(
            value: difficulty,
            items: const [
              DropdownMenuItem(value: 1, child: Text('Easy')),
              DropdownMenuItem(value: 2, child: Text('Medium')),
              DropdownMenuItem(value: 3, child: Text('Hard')),
            ],
            onChanged: (v) { difficulty = v ?? difficulty; },
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(ctx, (nameCtrl.text.trim(), difficulty)), child: const Text('Save')),
      ],
    ),
  );
}

Future<AntiHabitItem?> _showAddAntiHabitDialog(BuildContext context) async {
  return _showEditAntiHabitDialog(context, AntiHabitItem(id: UniqueKey().toString(), name: '', targetMinutes: 10));
}

Future<AntiHabitItem?> _showEditAntiHabitDialog(BuildContext context, AntiHabitItem src) async {
  final nameCtrl = TextEditingController(text: src.name);
  int target = src.targetMinutes;
  bool interception = src.interceptionEnabled;
  final Set<int> hours = {...src.dangerHours};
  return showDialog<AntiHabitItem?>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: const Text('Anti-Habit'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: 'Name')),
              const SizedBox(height: 8),
              Row(children:[
                const Text('Target minutes/day: '),
                const SizedBox(width: 8),
                DropdownButton<int>(
                  value: target,
                  items: const [5,10,15,20,30,45,60].map((v)=>DropdownMenuItem(value: v, child: Text('$v'))).toList(),
                  onChanged: (v) => setState(() => target = v ?? target),
                ),
              ]),
              const SizedBox(height: 8),
              const Text('Danger windows:'),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6, runSpacing: 6,
                children: [
                  for (int h=0; h<24; h++)
                    ChoiceChip(
                      label: Text(h.toString().padLeft(2,'0')),
                      selected: hours.contains(h),
                      onSelected: (sel){ setState((){ sel ? hours.add(h) : hours.remove(h); }); },
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Row(children:[
                Switch(value: interception, onChanged: (v)=> setState(()=> interception = v)),
                const SizedBox(width: 8),
                const Text('Enable Interception'),
              ]),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(onPressed: () {
            final name = nameCtrl.text.trim();
            if (name.isEmpty) { Navigator.pop(ctx); return; }
            Navigator.pop(ctx, AntiHabitItem(
              id: src.id,
              name: name,
              targetMinutes: target,
              dangerHours: hours,
              interceptionEnabled: interception,
              cleanStreak: src.cleanStreak,
            ));
          }, child: const Text('Save')),
        ],
      ),
    ),
  );
} 