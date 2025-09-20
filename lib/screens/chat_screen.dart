import 'package:flutter/material.dart';
import '../design/glass.dart';
import '../services/api_client.dart';
import '../audio/tts_provider.dart';
import '../models/mentor.dart';
import '../widgets/mentor_selector.dart';

enum Persona { harsh, coach, zen }

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  Persona persona = Persona.harsh;
  Mentor selectedMentor = LegendaryMentors.drillSergeant;
  final List<Map<String, String>> chat = [
    {'role': 'sys', 'text': 'Welcome to DrillSergeantX. Choose your legendary mentor above.'},
  ];
  final controller = TextEditingController();
  bool isLoading = false;
  
  List<String> get quicks => selectedMentor.quickResponses;

  final tts = TtsProvider();

  @override
  void initState() {
    super.initState();
    apiClient.setAuthToken('valid-token');
  }

  void _onMentorChanged(Mentor mentor) {
    setState(() {
      selectedMentor = mentor;
      // Add system message about mentor change
      chat.add({
        'role': 'sys', 
        'text': '${mentor.name} has joined you. ${mentor.signature}',
      });
    });
  }

  void _send(String text) async {
    if (text.trim().isEmpty || isLoading) return;
    
    setState(() {
      chat.add({'role': 'user', 'text': text.trim()});
      isLoading = true;
    });
    controller.clear();

    try {
      // Call real API with mentor personality
      final response = await apiClient.sendChatMessage(
        text.trim(),
        mode: selectedMentor.id,
      );
      
      final replyText = (response['reply'] ?? 'Acknowledged. Keep pushing.').toString();
      final presetId = (response['audioPresetId'] ?? '').toString();
      
      setState(() {
        chat.add({
          'role': 'sgt', 
          'text': replyText,
        });
        isLoading = false;
      });
      
      // Optionally auto-speak if desired; for now keep manual via button
      
    } catch (e) {
      // Surface error for debugging
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Chat error: $e')),
      );
      final reply = _craftReply(text.trim());
      setState(() {
        chat.add({'role': 'sgt', 'text': reply});
        isLoading = false;
      });
    }
  }

  String _personaToMode(Persona persona) {
    switch (persona) {
      case Persona.harsh:
        return 'strict';
      case Persona.coach:
        return 'balanced';
      case Persona.zen:
        return 'light';
    }
  }

  String _craftReply(String msg) {
    final lower = msg.toLowerCase();
    switch (persona) {
      case Persona.harsh:
        if (lower.contains('procrast')) return 'Quit whining. 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. Move.';
        if (lower.contains('plan')) return 'Plan: 1) Pick one task. 2) 25‑min focus. 3) Report DONE.';
        return 'Outstanding. Keep that fire.';
      case Persona.coach:
        if (lower.contains('procrast')) return 'Reset: one small rep, then a clean 25. You got this.';
        if (lower.contains('plan')) return 'Pick the next best task, lock a 25, debrief in one sentence.';
        return 'Nice rep—stack another.';
      case Persona.zen:
        if (lower.contains('procrast')) return 'Notice the resistance. One mindful step, then begin a 25 minute sit.';
        if (lower.contains('plan')) return 'Choose one task. Breathe. Begin with presence.';
        return 'Calm power.';
    }
  }

  Future<void> _speakLastReply() async {
    // Find last sgt message
    for (int i = chat.length - 1; i >= 0; i--) {
      if (chat[i]['role'] == 'sgt') {
        final text = chat[i]['text'] ?? '';
        final mode = _personaToMode(persona);
        await tts.speakDynamic(text, voiceVariant: mode);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassAppBar(
        title: '${selectedMentor.name} - ${selectedMentor.title}',
        backgroundColor: selectedMentor.primaryColor,
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            // Legendary Mentors Selector
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    selectedMentor.primaryColor.withOpacity(0.1),
                    selectedMentor.accentColor.withOpacity(0.1),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: selectedMentor.primaryColor.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: MentorSelector(
                selectedMentor: selectedMentor,
                onMentorChanged: _onMentorChanged,
              ),
            ),
            const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: isLoading ? null : _speakLastReply,
                    icon: const Icon(Icons.volume_up, size: 16),
                    label: const Text('Speak', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      visualDensity: VisualDensity.compact,
                      minimumSize: const Size(0, 32),
                    ),
                    ),
                  ],
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  border: Border.all(color: Colors.white.withOpacity(0.12)),
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(10),
                child: ListView.builder(
                  itemCount: chat.length + (isLoading ? 1 : 0),
                  itemBuilder: (context, i) {
                    if (isLoading && i == chat.length) {
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.12)),
                          ),
                          child: const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      );
                    }
                    
                    final m = chat[i];
                    final isUser = m['role'] == 'user';
                    final isSgt = m['role'] == 'sgt';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isUser
                              ? Colors.amber
                              : isSgt
                                  ? Colors.white.withOpacity(0.06)
                                  : Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.12)),
                        ),
                        child: Text(
                          m['text'] ?? '',
                          style: TextStyle(color: isUser ? Colors.black : Colors.white),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 36,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
              children: quicks
                      .map((q) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: OutlinedButton(
                        onPressed: isLoading ? null : () => _send(q),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                minimumSize: const Size(0, 30),
                                visualDensity: VisualDensity.compact,
                              ),
                              child: Text(q, style: const TextStyle(fontSize: 11)),
                            ),
                      ))
                  .toList(),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    enabled: !isLoading,
                    decoration: const InputDecoration(hintText: 'Type your report...'),
                    onSubmitted: _send,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: isLoading ? null : () => _send(controller.text),
                  style: ElevatedButton.styleFrom(minimumSize: const Size(0, 40)),
                  child: isLoading 
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Send'),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
} 