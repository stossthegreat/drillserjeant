import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  int stepIndex = 0;
  String? selectedMentor;
  final Set<String> selectedHabits = {};
  bool morning = true, midday = true, evening = true;
  bool notificationsEnabled = false;

  late final AnimationController _anim;

  final List<_StepSpec> steps = [];

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 200));
    _buildSteps();
  }

  void _buildSteps() {
    steps.clear();
    steps.addAll([
      _StepSpec(
        id: 'welcome',
        title: 'Welcome to Drill OS',
        subtitle: 'The first active Habit OS — alive, not passive.',
        body: _buildWelcome(),
      ),
      _StepSpec(
        id: 'account',
        title: 'Create Account',
        subtitle: 'Sign in to sync your progress across devices.',
        body: _buildAccount(),
      ),
      _StepSpec(
        id: 'mentor',
        title: 'Choose Your Mentor',
        subtitle: 'Pick a voice to guide (or push) you.',
        body: _buildMentorChoice(),
      ),
      _StepSpec(
        id: 'habits',
        title: 'Build Your Stack',
        subtitle: 'Select 3–6 core habits. You can edit later.',
        body: _buildHabitsChoice(),
      ),
      _StepSpec(
        id: 'schedule',
        title: 'Set Your Cadence',
        subtitle: 'When should we nudge you?',
        body: _buildSchedule(),
      ),
      _StepSpec(
        id: 'permissions',
        title: 'Stay On Track',
        subtitle: 'Enable notifications so your mentor can reach you.',
        body: _buildPermissions(),
      ),
      _StepSpec(
        id: 'paywall',
        title: 'Unlock Drill OS',
        subtitle: 'Go Free or power up with Pro.',
        body: _buildPaywall(),
      ),
    ]);
  }

  bool get canProceed {
    final id = steps[stepIndex].id;
    if (id == 'mentor') return selectedMentor != null;
    if (id == 'habits') return selectedHabits.length >= 3 && selectedHabits.length <= 6;
    if (id == 'schedule') return morning || midday || evening;
    return true;
  }

  void _next() {
    if (!canProceed) return;
    if (stepIndex < steps.length - 1) {
      setState(() => stepIndex++);
    } else {
      _complete();
    }
  }

  void _prev() {
    if (stepIndex > 0) setState(() => stepIndex--);
  }

  Future<void> _complete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
    if (mounted) context.go('/home');
  }

  Widget _buildWelcome() {
    return _GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Active Habit Operating System', style: TextStyle(fontSize: 16, color: Colors.white70)),
          const SizedBox(height: 8),
          const Text('A council of mentors that remembers, adapts, and pushes you daily.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 16),
          Wrap(spacing: 8, runSpacing: 8, children: const [
            _Badge('Mentor Voices'), _Badge('Strictness Levels'), _Badge('Weekly Reports'),
          ]),
        ],
      ),
    );
  }

  Widget _buildAccount() {
    return _GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Sign in to sync your data and keep your streaks safe.', style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 12),
        Row(children: [
          _Button(label: 'Continue with Email', onTap: _next, filled: true),
          const SizedBox(width: 8),
          _Button(label: 'Guest Mode', onTap: _next),
        ]),
        const SizedBox(height: 8),
        const Text('You can link your account later in settings.', style: TextStyle(fontSize: 12, color: Colors.white54)),
      ]),
    );
  }

  Widget _buildMentorChoice() {
    const mentorList = [
      ['drill', 'Drill Sergeant', 'Aggressive • No excuses'],
      ['marcus', 'Marcus Aurelius', 'Stoic • Calm Authority'],
      ['confucius', 'Confucius', 'Order • Discipline'],
      ['buddha', 'Buddha', 'Compassion • Presence'],
      ['lincoln', 'Abraham Lincoln', 'Moral • Resolute'],
    ];
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: mentorList.map((m) {
        final active = selectedMentor == m[0];
        return _ChoiceCard(
          active: active,
          title: m[1],
          subtitle: m[2],
          onTap: () => setState(() => selectedMentor = m[0]),
        );
      }).toList(),
    );
  }

  Widget _buildHabitsChoice() {
    const starters = [
      ['water', 'Drink 2L Water'],
      ['steps', '8k Steps'],
      ['sleep', 'Sleep by 11pm'],
      ['focus', '45m Deep Work'],
      ['gym', 'Workout'],
      ['reading', 'Read 10 pages'],
    ];
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: starters.map((h) {
        final active = selectedHabits.contains(h[0]);
        return _ChoiceCard(
          active: active,
          title: h[1],
          subtitle: active ? 'Selected' : 'Starter',
          onTap: () => setState(() {
            if (active) {
              selectedHabits.remove(h[0]);
            } else {
              selectedHabits.add(h[0]);
            }
          }),
        );
      }).toList(),
    );
  }

  Widget _buildSchedule() {
    return Row(children: [
      Expanded(child: _ChoiceCard(active: morning, title: 'Morning', subtitle: 'Primer & plan', onTap: () => setState(() => morning = !morning))),
      const SizedBox(width: 12),
      Expanded(child: _ChoiceCard(active: midday, title: 'Midday', subtitle: 'Adaptive nudge', onTap: () => setState(() => midday = !midday))),
      const SizedBox(width: 12),
      Expanded(child: _ChoiceCard(active: evening, title: 'Evening', subtitle: 'Reflection', onTap: () => setState(() => evening = !evening))),
    ]);
  }

  Widget _buildPermissions() {
    return _GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Enable notifications so your mentor can reach you at the right moment.', style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 12),
        _Button(
          label: notificationsEnabled ? 'Enabled' : 'Enable Notifications',
          onTap: () => setState(() => notificationsEnabled = true),
          filled: !notificationsEnabled,
        ),
      ]),
    );
  }

  Widget _buildPaywall() {
    return _GlassCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Unlock mentors with real voices, strictness levels, adaptive nudges, and report cards.', style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 12),
        Row(children: [
          _Button(label: 'Start Pro', onTap: _complete, filled: true),
          const SizedBox(width: 8),
          _Button(label: 'Maybe Later', onTap: _complete),
        ]),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final spec = steps[stepIndex];
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(color: Colors.green.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                      alignment: Alignment.center,
                      child: const Text('D', style: TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 8),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Drill OS', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text('Active Habit Operating System', style: TextStyle(color: Colors.white38, fontSize: 11)),
                      ],
                    ),
                  ]),
                  _ProgressDots(index: stepIndex, total: steps.length),
                ],
              ),
              const SizedBox(height: 12),
              Text(spec.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: Colors.white)),
              const SizedBox(height: 4),
              Text(spec.subtitle, style: const TextStyle(color: Colors.white54)),
              const SizedBox(height: 12),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: Container(key: ValueKey(spec.id), child: spec.body),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(onPressed: stepIndex==0?null:_prev, child: const Row(children:[Icon(Icons.chevron_left, size: 18), Text('Back')]))
                      ,
                  Text(
                    (!canProceed && steps[stepIndex].id=='mentor') ? 'Select a mentor' :
                    (!canProceed && steps[stepIndex].id=='habits') ? 'Choose 3–6' :
                    (!canProceed && steps[stepIndex].id=='schedule') ? 'Pick at least one' : '',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  ElevatedButton(
                    onPressed: canProceed ? _next : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: canProceed ? Colors.greenAccent : Colors.grey.shade800,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Row(children: [const Text('Next'), const Icon(Icons.chevron_right, size: 18)]),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepSpec {
  final String id;
  final String title;
  final String subtitle;
  final Widget body;
  _StepSpec({required this.id, required this.title, required this.subtitle, required this.body});
}

class _GlassCard extends StatelessWidget {
  final Widget child;
  const _GlassCard({required this.child});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white10),
        color: const Color(0xFF0c0f0e).withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: child,
    );
  }
}

class _ChoiceCard extends StatelessWidget {
  final bool active;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _ChoiceCard({required this.active, required this.title, required this.subtitle, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 180,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: active ? Colors.greenAccent : Colors.white10),
          color: active ? Colors.green.withOpacity(0.1) : Colors.white10.withOpacity(0.04),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
        ]),
      ),
    );
  }
}

class _Button extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool filled;
  const _Button({required this.label, required this.onTap, this.filled = false});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: filled ? Colors.greenAccent : Colors.transparent,
          border: Border.all(color: filled ? Colors.transparent : Colors.white10),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(label, style: TextStyle(color: filled ? Colors.black : Colors.white)),
      ),
    );
  }
}

class _ProgressDots extends StatelessWidget {
  final int index;
  final int total;
  const _ProgressDots({required this.index, required this.total});
  @override
  Widget build(BuildContext context) {
    return Row(children: List.generate(total, (i) {
      final active = i == index;
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        height: 6,
        width: active ? 20 : 8,
        decoration: BoxDecoration(
          color: active ? Colors.greenAccent : Colors.white10,
          borderRadius: BorderRadius.circular(8),
        ),
      );
    }));
  }
}

class _Badge extends StatelessWidget {
  final String text;
  const _Badge(this.text);
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8, bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }
} 